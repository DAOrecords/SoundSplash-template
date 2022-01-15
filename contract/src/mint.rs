use crate::*;
use near_sdk::serde::{Serialize, Deserialize};


// Probably this should be moved. This is the _extra_ property of the NFT standard. It will be stored as JSON serialized string.
#[derive(Serialize, Deserialize)]                                 
#[serde(crate = "near_sdk::serde")]
struct Extra {
    music_cid: Option<String>,
    music_hash: Option<Base64VecU8>,
    parent: Option<TokenId>,
    instance_nounce: u128,
}

#[near_bindgen]
impl Contract {
    /// `mint_root` will mint a new root NFT, that has a unique music attached to it (IPFS CID),
    /// will automatically mint 2 children. The root NFT goes to `receiver_id`, the 2 children go to Vault.
    /// `perpetual_royalties` is not used yet.
    /// `token_id` should be calculated inside the contract. But we will not delete this parameter yet.
    /// First we will pass token_id from front-end
    #[payable]
    pub fn mint_root(
        &mut self,
        metadata: TokenMetadata,
        receiver_id: AccountId,
        perpetual_royalties: Option<HashMap<AccountId, u32>>,
    ) {
        log!("Starting MintRoot...");
        let initial_storage_usage = env::storage_usage();                                       // Take note of initial storage usage for refund
        let mut royalty = HashMap::new();                                                       // Create royalty map to store in the token

        if let Some(perpetual_royalties) = perpetual_royalties {
            assert!(perpetual_royalties.len() < 7, "Cannot add more than 6 perpetual royalty amounts");
    
            for (account, amount) in perpetual_royalties {
                royalty.insert(account, amount);
            }
        }

        let token_id = "fono-root-".to_string() + &self.root_nounce.to_string();                // We generate the ID for the RootNFT. The RootNFT ID only has 1 number in it, like fono-root-22
        self.root_nounce = self.root_nounce + 1;                                                // We increment nounce to avoid collision

        let token = Token {
            owner_id: receiver_id,
            approved_account_ids: Default::default(),
            next_approval_id: 0,
            royalty,
        };

        assert!(
            self.tokens_by_id.insert(&token_id, &token).is_none(),
            "Token already exists!"
        );


        // Although `instance_nounce` is sent from front-end, we make sure that it's value is 0
        let mut modified_metadata = metadata;
        let mut extra_obj: Extra = serde_json::from_str(&modified_metadata.extra.unwrap()).unwrap();
        extra_obj.instance_nounce = 0;
        modified_metadata.extra = Some(serde_json::to_string(&extra_obj).unwrap());

        self.token_metadata_by_id.insert(&token_id, &modified_metadata);                        // Insert new NFT
        self.internal_add_token_to_owner(&token.owner_id, &token_id);

        let nft_mint_log: EventLog = EventLog {                                                 // Construct the mint log as per the events standard.
            standard: NFT_STANDARD_NAME.to_string(),
            version: NFT_METADATA_SPEC.to_string(),
            event: EventLogVariant::NftMint(vec![NftMintLog {
                owner_id: token.owner_id.to_string(),
                token_ids: vec![token_id.to_string()],
                memo: None,
            }]),
        };

        env::log_str(&nft_mint_log.to_string());                                                // Log the serialized json.

        
        self.create_children(token_id.clone(), token_id, Some(HashMap::new()));                 // This has to happen before the refund

        let required_storage_in_bytes = env::storage_usage() - initial_storage_usage;
        refund_deposit(required_storage_in_bytes);                                              // Refund not-used storage
    }

    /// 'create_children' will mint 2 new NFTs and put them to the Vault
    /// * `token_id` is id of the new token this should be probably generated from inside the contract as well
    /// * `parent` id of the parent NFT
    /// * `perpetual_royalties` probably we won't have this field
    #[payable]
    pub(crate) fn create_children(
        &mut self,
        root: TokenId,
        parent: TokenId,
        perpetual_royalties: Option<HashMap<AccountId, u32>>,
    ) {
        log!("Starting CreateChildren...");
        let initial_storage_usage = env::storage_usage();                                       // Take note of initial storage usage for refund
                                                                                                // This probably shouldn't exist, because create_children should be always wrapped in other functiongit                                                                                                      
        
        for child_num in 0..2 {
            log!("Entering loop...{}", child_num);
            let mut royalty = HashMap::new();                                                   // We will decide on this later. Probably royalty shouldn't exist here
            /*if let Some(perpetual_royalties) = perpetual_royalties {
                assert!(perpetual_royalties.len() < 7, "Cannot add more than 6 perpetual royalty amounts");
        
                for (account, amount) in perpetual_royalties {
                    royalty.insert(account, amount);
                }
            }*/

            // We create the token_id. For this, we need the meta of the root NFT. We need to increment nounce
            let mut root_metadata = self.token_metadata_by_id.get(&root.to_owned()).unwrap();
            let mut root_extra_obj: Extra = serde_json::from_str(&root_metadata.extra.unwrap()).unwrap();
            let token_id = "fono-root-".to_string() + &self.root_nounce.to_string() + &"-".to_string() + &root_extra_obj.instance_nounce.to_string();
            root_extra_obj.instance_nounce = root_extra_obj.instance_nounce + 1;                // We increment instance_nounce
            root_metadata.extra = Some(serde_json::to_string(&root_extra_obj).unwrap());
            self.token_metadata_by_id.insert(&root, &root_metadata);                            // Insert back the updated root meta
            env::log_str(&serde_json::to_string(&root_extra_obj).unwrap());
            
            // We write the parent to the current NFT extra. 
            let mut metadata = self.token_metadata_by_id.get(&parent.to_owned()).unwrap();
            let mut extra_obj: Extra = serde_json::from_str(&metadata.extra.unwrap()).unwrap();
            extra_obj.parent =  Some(parent.clone());
            metadata.extra = Some(serde_json::to_string(&extra_obj).unwrap());
            env::log_str(&serde_json::to_string(&extra_obj).unwrap());
    
            let token = Token {
                owner_id: env::current_account_id(),
                approved_account_ids: Default::default(),                                       // This is an individual NFT, all the values should start with 0,
                next_approval_id: 0,                                                            // just like in the Root
                royalty,
            };
    
            assert!(
                self.tokens_by_id.insert(&token_id, &token).is_none(),
                "Token already exists!"
            );
    
            
            
            self.token_metadata_by_id.insert(&token_id, &metadata);                             // Insert new NFT
            self.internal_add_token_to_owner(&token.owner_id, &token_id);                       // &token.owner_id will refer to self (contract)
            
            let nft_mint_log: EventLog = EventLog {                                             // Construct the mint log as per the events standard.
                standard: NFT_STANDARD_NAME.to_string(),                                        // same as with Root
                version: NFT_METADATA_SPEC.to_string(),
                event: EventLogVariant::NftMint(vec![NftMintLog {
                    owner_id: token.owner_id.to_string(),
                    token_ids: vec![token_id.to_string()],
                    memo: None,
                }]),
            };
            
            env::log_str(&nft_mint_log.to_string());                                            // Log the serialized json.    
        }

        let required_storage_in_bytes = env::storage_usage() - initial_storage_usage;

        refund_deposit(required_storage_in_bytes);                                          // Refund not-used storage
    }
}