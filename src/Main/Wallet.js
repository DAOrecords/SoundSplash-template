import React from 'react';
import { login, logout, getBalance } from '../utils';
import nearLogo from '../assets/near.svg';


export default function Wallet({setShowWallet, showWallet, transparent, setMenuOpen}) {
  const [balance, setBalance] = React.useState("NaN");
  const [dollar, setDollar] = React.useState("NaN");

  React.useEffect(async () => {
    const result = await getBalance();
    setBalance(result);
    const nearPrice = await fetch("https://api.binance.com/api/v3/ticker/price?symbol=NEARUSDT")
      .then((res) => res.json())
      .catch((err) => {
        console.error("Error while fetching NEAR price", err);
        return { price: 0 }
      });
    const dResult = nearPrice.price * result;
    setDollar(dResult);
  }, [])

  function formatNumber(number, maxDecimal) {
    return Math.round(number * Math.pow(10,maxDecimal)) / Math.pow(10,maxDecimal)
  }

  function badgeClicked() {
    setMenuOpen(false);
    setShowWallet(!showWallet);
  }

  if (!window.walletConnection.isSignedIn()) {
    return (
      <>
        <div className="controls controlsLast">
          <button onClick={login}  className="mainWalletBadge">Connect Wallet</button>
        </div>
      </>
    );
  } else {
    return (
      <>
        <div className="controls controlsLast">
          <button className={transparent ? "mainWalletBadge mainWalletBadgeTransparent" : "mainWalletBadge"}
            onClick={badgeClicked}
            
            tabIndex={"0"}
          >
            {window.accountId}
          </button>
        </div>

        {showWallet && (
          <div id="wallet" className="mainWalletContainer">
            <div id="mainWalletBalanceFlex">
              <p>BALANCE</p>
              
              <p className="walletFlexPlaceholder"></p>
              <p>{formatNumber(balance, 3)}</p>
            </div>            
            <div id="mainWalletDollarFlex">
              <p className="walletFlexPlaceholder"></p>
              <p>~ ${formatNumber(dollar, 2)}</p>
            </div>
            <div id="mainWalletButtonContainer">
              <button onClick={logout} id="mainDisconnect">DISCONNECT</button>
            </div>
          </div>
        )}
      </>
    )
  }
}
