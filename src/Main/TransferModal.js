import React, { useEffect, useState } from "react";
import AudioPlayer from '../Common/AudioPlayer';
import AudioPlayerNftStorage from "../Common/AudioPlayerNftStorage";
import { getAllFromRoot, getContractName, transferNft, verify_sha256 } from '../utils'


export default function TransferModal({token, artistList, newAction, setOpenModal}) {
  const [receiver, setReceiver] = useState("");
  const [transferInputOpen, setTransferInputOpen] = useState(false);
  const [selected, setSelected] = useState("info");
  const [all, setAll] = useState([]);                                     // All NFTs that belong to same root. Including root.
  const [vault, setVaultName] = useState("");  
  
  const title = token.metadata.title;
  const description = token.metadata.description;
  const imageCID = token.metadata.media;
  const extra = JSON.parse(token.metadata.extra);

  function close(e) {
    if (e.key === 'Escape') setTransferInputOpen(false);
  }

  useEffect(async () => {
    const vaultName = await getContractName();
    setVaultName(vaultName);

    const FonoRootRegEx = /fono-root-[0-9]{1,9}/;
    const root = token.token_id.match(FonoRootRegEx)[0];
    const fetchResult = await getAllFromRoot(root);
    setAll(fetchResult);

    window.addEventListener('keydown', close);

    return () => window.removeEventListener('keydown', close);
  }, [])
  

  async function handleInputChange(accountName) {
    setReceiver(accountName);
  }

  async function transfer() {
    await fetch(`https://nearblocks.io/api/account/balance?address=${receiver}`)                        // Test if account exists or not (by account balance)
      .then((res) => res.json())
      .then((json) => {
        if (json.balance) {                                                                             // Initiate the transfer if the balance field exists (otherwise we would have a message field instead)
          const transferPromise = new Promise(async (resolve, reject) => {
            const transferResult = await transferNft(token.token_id, receiver);
            if (transferResult) {
              resolve("success(transfer)");
            } else {
              reject("reject(transfer)");
            }
          })
          newAction({
            thePromise: transferPromise, 
            pendingPromiseTitle: "Prepairing transaction...", pendingPromiseDesc: "plase wait",
            successPromiseTitle: "Redirecting to transaction", successPromiseDesc: "Please sign the transaction in the next screen!",
            errorPromiseTitle: "Redirecting to transaction", errorPromiseDesc: "Please sign the transaction in the next screen!"
          });
        }
        else newAction({                                                                                // Toast message if it does not exist
          errorMsg: "This address does not exist. Please check the receiver address!", errorMsgDesc: "",
        });
      })
      .catch((err) => {                                                                                 // Toast message if there was an error with the API request
        console.error("There was an error while testing if user exists or not. ", err);
        newAction({
          errorMsg: "There was an error while testing the address. Please try again!", errorMsgDesc: "",
        });
        return;
      });
  }

  function getNftStorageLink(tokenId) {
    console.log("tokenId inside getArtistIndex: ", tokenId);

    /** We will manually need to update this list throughout the SoundSplash */
    if (tokenId.includes('fono-root-0-') || tokenId === 'fono-root-0') return "https://bafybeiehqpn5z5izotm5ddnhvqkoj3ovylgqnnpz3wuhmrhurwh5dwanii.ipfs.nftstorage.link/";
    if (tokenId.includes('fono-root-2-') || tokenId === 'fono-root-2') return "https://bafybeid2ojnkez22otr3aeajs33vnsl7do6vwhsreufzn53zwirjn4lrb4.ipfs.nftstorage.link/";
    if (tokenId.includes('fono-root-3-') || tokenId === 'fono-root-3') return "https://nftstorage.link/ipfs/bafybeif55rfqftq6jkpuabvxuj2zm555zb5dpr6z4ha4m6dpfxodu5lobi";
    if (tokenId.includes('fono-root-4-') || tokenId === 'fono-root-4') return "https://bafybeihpdjr36dqneqfunibpr56sm2i4h5hsykho5dov2xtflglnh6sceq.ipfs.nftstorage.link/";
    return null;
  }


  return (
    <div className="nftDetailsModal">
      <div id="nftDetailsModalPicture">
        <img src={`https://daorecords.io:8443/fetch?cid=${imageCID}`} alt={title}></img>
      </div>
      <div id="nftDetailsModalRightSide">
        <button id="nftDetailsModalClose" onClick={() => setOpenModal(false)}><CloseButton /></button>
        <div id="nftDetailsModalTitleAndGen">
          <p>{token.metadata.title}</p>
          <p>#{JSON.parse(token.metadata.extra).generation}</p>
        </div>
        <ul id="nftDetailsModalArtistList">
          {artistList.map((artist) => (
            <li>
              {artist.name}
            </li>
          ))}
        </ul>
        <div className="nftDetailsModalMenuLine">
          <button 
            onClick={() => setSelected("info")} 
            className={"nftDetailsModalMenuButton " + (selected === "info" ? "nftDetailsModalMenuSelected" : null)}
          >
            INFO
          </button>
          <button 
            onClick={() => setSelected("owners")} 
            className={"nftDetailsModalMenuButton " + (selected === "owners" ? "nftDetailsModalMenuSelected" : null)}
          >
            OWNERS
          </button>
          <button 
            onClick={() => setSelected("history")}
            className={"nftDetailsModalMenuButton " + (selected === "history" ? "nftDetailsModalMenuSelected" : null)}
          >
            HISTORY
          </button>
        </div>
        <div className={"nftDetailsModalSwitchableBox " + (selected !== "info" ? "scroll" : null)}>
          {(selected === "info") && (
            <>
              {description}
            </>
          )}

          {(selected === "owners") && (
            <>
              {all.map((nft) => (
                <div className="nftDetailsModalRightOwnerDiv">
                  {nft.owner_id === vault ? 
                    <p className="nftDetailsModalRightAccount">Vault</p>
                  : 
                    <p className="nftDetailsModalRightAccount">{nft.owner_id}</p>
                  }
                  <p className="nftDetailsModalRightGen">GEN: {JSON.parse(nft.metadata.extra).generation}</p>
                </div>
              ))}
            </>
          )}

          {(selected === "history") && (
            <>
              <p></p>
            </>
          )}
        </div>
        <div id="nftDetailsModalOwnerBox">
          <p>OWNER</p>
          <p>{token.owner_id}</p>
        </div>
        <div id="nftDetailsModalAudio">
          {true ? 
            <AudioPlayerNftStorage 
              nftStorageLink={`https://daorecords.io:8443/fetch?cid=${extra.music_cid}`}
              color={"#121212"}
              dark={true}
            />
            :
            <p className="loadingLabel">loading music...</p>
          }
        </div>
        <div id="nftDetailsModalButtons">
          <button onClick={() => setTransferInputOpen(true)}>Transfer</button>
        </div>        
      </div>

      {transferInputOpen && (<div id="transferPopupWrapper" onClick={() => setTransferInputOpen(false)}>
        <div id="transferPopup" onClick={e => e.stopPropagation()} >
          <p className="transferPopupTitle">Confirm Transfer</p>
          <div>
            <p className="transferPopupNormalText transferPopupInline">{"You are about to send "}
            <p className="transferPopupBoldText transferPopupInline">
              {token.metadata.title} #{extra.generation}</p>
            </p>
            <p className="transferPopupNormalText transferPopupInline">{" to:"}</p>
          </div>
          <label className="visually-hidden">Receiver</label>
          <input 
            type={"text"} 
            value={receiver} 
            onChange={(e) => handleInputChange(e.target.value)} 
            className="transferPopupInput" 
          />
          <p className="transferPopupNormalText">You will be redirected to NEAR Web Wallet to confirm your transaction.</p>
          <button className="transferPopupButton" onClick={transfer}>Transfer</button>
        </div>
      </div>)}
    </div>
  );
}


function CloseButton() {
  return(
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12.5 9.0625H15.625V19.375H4.375V9.0625H7.5" stroke="#121212" strokeMiterlimit="10"/>
      <path d="M13.4375 5L10 0.9375L6.5625 5M10 13.75V0.9375V13.75Z" stroke="#121212" strokeMiterlimit="10"/>
    </svg>
  )
}