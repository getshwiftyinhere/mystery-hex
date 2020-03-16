if (typeof web3 !== "undefined") {
  //get available accounts
  web3.eth.getAccounts(function (err, accounts) {
    if (err !== null) {
      errorMessage("An error occurred: " + err);
    } else if (accounts.length == 0) //is user logged in?
    {
      setTimeout(function () {
        errorMessage("Login to your wallet and Connect to use MYSTERY<b>HEX</b>");
      }, 5000);
    } else {
      account = accounts[0];
      activeAccount = account;
      web3.eth.defaultAccount = account;
      document.getElementById("userAddress").innerHTML = activeAccount;
      clearInterval(accountInterval);
      //interval for account change
			accountInterval = setInterval(function () {
				console.log("Checking wallet presence...");
				web3.eth.getAccounts(function (err, accounts) {
					if (accounts[0] !== activeAccount) {
						console.log("Wallet change detected, refreshing page...");
            activeAccount = accounts[0];
						location.reload();
					} else {
            console.log("Active wallet = " + activeAccount);
					}
				});
			}, 5000);
    }
  });
}

async function ShowBalance(){
  await Connect();
  hexContract.methods.balanceOf(activeAccount).call().then(function(balance){
    document.getElementById("walletBalance").innerHTML = parseInt(balance / 10 ** decimals) + " HEX";
  });
}

function CheckDecimal(input){
  var isDecimal = (input.value - Math.floor(input.value)) !== 0; 
  if (isDecimal){
    errorMessage('Decimal places not supported, use whole numbers.');
  }
}
/*-----------------STAKING-----------------*/
async function StakeHex() {
  if (typeof web3 !== "undefined") {
    Connect();
    await RandomizeStakeValue();
    const input = document.getElementById('hexStake');
    if (input.value <= 0) {
      errorMessage('Input HEX amount to stake.');
      return;
    } else {
      // Get the checkbox
      var checkBox = document.getElementById("BPDCheckBox");
      var min = 1;
      var max = 3650;
      // If the checkbox is checked, make sure stake length is over BPD
      if (checkBox.checked == true) {
        min = parseInt(getDaysTillBPD());
        console.log("BPD guarantee");
        console.log("Days until BPD: "+min);
      }
      var randomStakedDays = getRandomInt(min, max);
      var value = parseInt(web3.utils.toBN(input.value));
      // calculate Heart amount
      var heartsAmount = value * 10 ** decimals;
      // call stake function
      hexContract.methods.stakeStart(heartsAmount, randomStakedDays).send({
          from: activeAccount
        })
        .on('transactionHash', function (hash) {
          console.log("txhash: " + hash);
        })
        .on('receipt', function(receipt){
          successMessage('All done! You can check your mystery stake <a href="https://go.hex.win/stake/?r=0xB1A7Fe276cA916d8e7349Fa78ef805F64705331E" target="_blank">here</a>!');
        })
        .on('error', function (error) {
          errorMessage('Something went wrong, try again.');
          console.log(error);
        });
    }
  }
}

function getDaysTillBPD() {
  var now = new Date();
  var bpdDate = new Date("11/19/2020");
  var Difference_In_Time = bpdDate.getTime() - now.getTime();
  return (Difference_In_Time / (1000 * 3600 * 24));
}

function RandomStakeValueWarn(){
  var input = document.getElementById("hexStake");
  var checkBox = document.getElementById("randomValue");
  if (checkBox.checked == true) {
    input.style.visibility = "collapse";
    errorMessage("Warning: this option could stake your entire balance!");
  }
  else{
    input.value = 0;
    input.style.visibility = "visible";
  }
}

async function RandomizeStakeValue(){
  var checkBox = document.getElementById("randomValue");
  if (checkBox.checked == true) {
    var balance = await hexContract.methods.balanceOf(activeAccount).call();
    var min = 1;
    var max = balance/10**decimals;
    console.log(max);
    var stakeValue = getRandomInt(min,parseInt(max));
    var input = document.getElementById("hexStake");
    input.value = stakeValue;
  }
  return true;
}

function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min)) + min; //The maximum is exclusive and the minimum is inclusive
}


/*-----------------DONATION----------------*/
function DonateEth() {
  if (typeof web3 !== "undefined") {
    Connect();
    //donate
    const input = document.getElementById('ethDonate');
    if (input.value <= 0) {
      return;
    } else {
      let donateWei = new window.web3.utils.BN(
        window.web3.utils.toWei(input.value, "ether")
      );
      window.web3.eth.net.getId().then(netId => {
        return window.web3.eth.getAccounts().then(accounts => {
          return window.web3.eth
            .sendTransaction({
              from: accounts[0],
              to: donationAddress,
              value: donateWei
            })
            .catch(e => {
              alert(e);
            });
        });
      });
    }
  }
}

function DonateHex() {
  if (typeof web3 !== "undefined") {
    Connect();
    //donate
    const input = document.getElementById('hexDonate');
    if (input.value <= 0) {
      return;
    } else {
      let donateTokens = input.value;
      let amount = web3.utils.toBN(donateTokens);

      window.web3.eth.net.getId().then(netId => {
        return window.web3.eth.getAccounts().then(accounts => {
          // calculate ERC20 token amount
          let value = amount * 10 ** decimals;
          // call transfer function
          return hexContract.methods.transfer(donationAddress, value).send({
              from: accounts[0]
            })
            .on('transactionHash', function (hash) {
              successMessage('Thank you! You can see your donation on https://etherscan.io/tx/' + hash);
            });
        }).catch(e => {
          errorMessage('Something went wrong, make sure your wallet is enabled and logged in.');
        });
      });
    }
  }
}