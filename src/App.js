import React from 'react';
import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import { ToastContainer, toast, Slide } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Admin from './Admin/Admin';
import TopMenu from './Admin/TopMenu';
import Footer from './Admin/Footer';
import Message from './Activity/Message';
import Pending from './Activity/Pending';
import Ok from './Activity/Ok';
import Err from './Activity/Err';
import MyNFTs from './Main/MyNFTs';
import Withdraw from './Admin/Withdraw';
import SingleDrop from './Main/SingleDropMain';
import AlbumDrop from './Main/AlbumDropMain';
import MixtapeDrop from './Main/MixtapeDropMain';
import TransferModal from './Main/TransferModal';


export default function App() {
  const [configObj, setConfigObj] = React.useState({});
  const [actionHistory, setActionHistory] = React.useState([]);                                         // For the Notifications drop-down. But now we only have this in Admin
  const [showActivity, setShowActivity] = React.useState(false);
  const [openGuestBook, setGuestBook] = React.useState(false);
  const [showWallet, setShowWallet] = React.useState(false);

  React.useEffect(async () => {
    const fetchObj = await fetch(window.location.origin + window.location.pathname + '/' + 'projectConfig.json')
    .then((response) => response.json())
    .catch((err) => console.error("Error while fetching projectConfig.json: ", err));
    setConfigObj(fetchObj);
  }, [])
  
  function newAction(actionObj) {
    //FireToast conditionally
    if (actionObj.thePromise) {
      toast.promise(
        actionObj.thePromise,
        {
          pending: {
            render() {
              return <div className="toastMargin"><Message title={actionObj.pendingPromiseTitle} desc={actionObj.pendingPromiseDesc} /></div>;
            }, 
            icon: <Pending />
          },
          success: {
            render({data}) {
              console.log("data", data)
              return <div className="toastMargin"><Message title={actionObj.successPromiseTitle} desc={actionObj.successPromiseDesc} /></div>
            },
            icon: <Ok />
          },
          error: {
            render({data}) {
              console.log("data", data)
              return <div className="toastMargin"><Message title={actionObj.errorPromiseTitle} desc={actionObj.errorPromiseDesc} /></div>
            },
            icon: <Err />
          }
        },
      ) // We set the history messages here
        .then(() => setActionHistory((prevArray) => {
          prevArray.push({ successMsg: actionObj.successPromiseTitle, successMsgDesc: actionObj.successPromiseDesc });
          return [...prevArray];
        }))
        .catch(() => setActionHistory((prevArray) => {
          prevArray.push({errorMsg: actionObj.errorPromiseTitle, errorMsgDesc: actionObj.errorPromiseDesc});
          return [...prevArray];
        }))
    } else {
      if (actionObj.errorMsg) toast.warn(actionObj.errorMsg);
      if (actionObj.successMsg) toast.success(actionObj.successMsg);
      if (actionObj.infoMsg) toast.info(actionObj.infoMsg);

      setActionHistory((prevArray) => {
        prevArray.push(actionObj);
        return [...prevArray];
      });
    }
  }

  // !! window.history.pushState({}, document.title, "/" + ""); was DEACTIVATED!

  return (
    <HashRouter>
      <Routes>
        <Route 
          exact
          path='/'
          element={<Navigate replace to="/mixtape-drop-example" />}
        />

        <Route 
          exact
          path='admin'
          element={
            <>
              <ToastContainer hideProgressBar={true} position="bottom-right" transition={Slide} />
              <TopMenu setShowActivity={setShowActivity} showActivity={showActivity} actionHistory={actionHistory} 
                setShowWallet={setShowWallet} showWallet={showWallet} />
              <Admin newAction={newAction} vault={configObj.contractName} />
              <Footer />
            </>
          }
        />
        <Route 
          exact
          path='my-nfts'
          element={
            <MyNFTs newAction={newAction} openGuestBook={openGuestBook} setGuestBook={setGuestBook} setShowWallet={setShowWallet} showWallet={showWallet} />
          }
        />
        <Route
          path='/contract/nfts/:contract/:tokenId'
          element={<TransferModal newAction={newAction} />}
        />

    {/** NFT Landing Page Examples */}

        {/** 
         * A Single NFT Drop
         * An index has to be provided
         * It's possible to have multiple NFTs on the contract, in that case, we would use multiple of this component, with different index
         */}
        <Route 
          exact
          path='single-drop-example'
          element={
            <SingleDrop 
              index={0} 
              newAction={newAction} configObj={configObj} openGuestBook={openGuestBook} setGuestBook={setGuestBook} setShowActivity={setShowActivity} showActivity={showActivity} actionHistory={actionHistory} setShowWallet={setShowWallet} showWallet={showWallet} 
            />
          }
        />

        {/** 
         * An Album NFT Drop
         * Index is not provided, 0 will be selected first. Album name is shown instead of Song name. Very similar to Mixtape
         * The name of the album should be provided by the @albumName parameter, we could easily write a function to use the NFT contract metadata here, altough that might not be equal by the album name.
         */}
        <Route 
          exact
          path='album-drop-example'
          element={
            <AlbumDrop 
              albumName={"Wonderful Album"}
              newAction={newAction} configObj={configObj} openGuestBook={openGuestBook} setGuestBook={setGuestBook} setShowActivity={setShowActivity} showActivity={showActivity} actionHistory={actionHistory} setShowWallet={setShowWallet} showWallet={showWallet} 
            />
          }
        />

        {/** 
         * A Mixtape NFT Drop
         * Index is not provided, 0 will be selected first. Song name is shown, just as with SingleDrop. Very similar to Album.
         * Mixtape name is shown in the SongMenu
         */}
        <Route 
          exact
          path='mixtape-drop-example'
          element={
            <MixtapeDrop
              newAction={newAction} configObj={configObj} openGuestBook={openGuestBook} setGuestBook={setGuestBook} setShowActivity={setShowActivity} showActivity={showActivity} actionHistory={actionHistory} setShowWallet={setShowWallet} showWallet={showWallet} 
            />
          }
        />

        <Route 
          exact
          path='withdraw'
          element={
            <>
              <ToastContainer hideProgressBar={true} position="bottom-right" transition={Slide} />
              <TopMenu setShowActivity={setShowActivity} showActivity={showActivity} actionHistory={actionHistory} 
                setShowWallet={setShowWallet} showWallet={showWallet} />
              <Withdraw />
              <Footer />
            </>
          }
        />
      </Routes>
    </HashRouter>
  );
}