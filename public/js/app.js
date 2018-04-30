App = {
  web3Provider: null,
  contracts: {},
  accounts: [],

  init: function () {
    return App.initWeb3()
  },

  initWeb3: function () {
    // Is there an injected web3 instance?
    if (typeof web3 !== 'undefined') {
      console.log('Using current web3 provider');
      App.web3Provider = web3.currentProvider
      App.accounts = [web3.eth.accounts];
    } else {
      // App.web3Provider = new Web3.providers.HttpProvider('https://ropsten.infura.io/KFE5TYWb91ldXs1crzLl')
      // console.log('web3Provider host is ' + App.web3Provider.host)
      alert('This version of the wallet requires MetaMask.  Please install MetaMask.')
    }

    web3 = new Web3(App.web3Provider)
    console.log('web3 api version is ' + web3.version.api)

    web3.version.getNetwork((err, netId) => {
      switch (netId) {
        case "1":
          console.log('This is mainnet')
          break
        case "2":
          console.log('This is the deprecated Morden test network.')
          break
        case "3":
          console.log('This is the ropsten test network.')
          break
        case "4":
          console.log('This is the Rinkeby test network.')
          break
        case "42":
          console.log('This is the Kovan test network.')
          break
        default:
          console.log('This is an unknown network.')
      }
    })

    return App.initContract()
  },

  initContract: function () {
    $.getJSON('/resources/WHPToken.json', function (res) {

      // Get the necessary contract artifact file and instantiate it with truffle-contract
      App.contracts.WHPToken = web3.eth.contract(res.abi).at('0x834ED5120425598E88E0055876642cA157589c51');

      console.log('Retrieve contract at ' + App.contracts.WHPToken.address);
      App.contracts.WHPToken.symbol(function (err, res) {
        $('.symbol').html(res);
      });

      App.contracts.WHPToken.Transfer({}, { fromBlock: 0, toBlock: 'latest' }).get((error, res) => {
        if (error) {
          console.log('Error in myEvent event handler: ' + error);
        }
        else {
          console.log(res);
          res.reverse().forEach(function (event) {
            console.log('Transfer Event: ' + JSON.stringify(event.args));
          })
        }
      });

      web3.eth.filter('latest', function(error, result){
        if (!error) {
          console.log(result);
          App.Wallet.render();
        } else {
          alert(error);
        }
      });

      App.Wallet.render();

      return true
    })

    return App.bindEvents()
  },

  bindEvents: function () {
    // $(document).on('click', '#playImage', App.executeBet)

    // document.getElementById("seedForm").addEventListener("submit", function (e) {
    //   e.preventDefault();

    //   App.Wallet.generate_addresses(document.getElementById("seed").value);

    //   $("#home").hide();
    //   $("#price").show();
    // })

    $('#deposit').click(function (e) {
      alert('deposit clicked');

      // TODO hide this
      let signerProvider = new SignerProvider('https://ropsten.infura.io/KFE5TYWb91ldXs1crzLl', {
        signTransaction: (rawTx, cb) => cb(null, SignerProvider.sign(rawTx, '0x6d86243a79ed65d5304cee11001b739117b06afe8fe5787002d76352a7d857e4')),
      });

      let tempWeb3 = web3;
      web3 = new Web3(signerProvider);

      let toAddress = web3.eth.defaultAccount;
      App.contracts.WHPToken.transfer(toAddress, new BigNumber(100).times(10 ** 18).toString(), { from: '0xE88915Ae42F77EBc12c0cF53Ffaffc495eD8F756' }, function (err, res) {
        alert("Congratulations!  100 WHP tokens have been deposited into your account. Txn Hash: " + res);

        web3 = tempWeb3;
        App.Wallet.render();
      });
    })

    document.getElementById("sendForm").addEventListener("submit", function (e) {
      e.preventDefault();

      App.Wallet.send_whp();
    })

    return true;
  },

  Wallet: {
    whpBalance: 0,

    render: function () {
      var html = "";
      for (var count = 0; count < App.accounts.length; count++) {
        html = html + "<option>" + App.accounts[count] + "</option>";
      }

      document.getElementById("fromAddress").innerHTML = html;

      document.getElementById("whp-address").innerHTML = web3.eth.defaultAccount;

      App.contracts.WHPToken.balanceOf(web3.eth.defaultAccount, function (err, res) {
        App.Wallet.whpBalance = new BigNumber(res).div(10 ** 18);
        document.getElementById("whp-balance").innerHTML = App.Wallet.whpBalance.toString();
        document.getElementById("whp-balance-big").innerHTML = App.Wallet.whpBalance.toFormat(2);
      });
    },

    generate_seed: function () {
      var new_seed = lightwallet.keystore.generateRandomSeed();

      document.getElementById("seed").value = new_seed;
    },

    generate_addresses: function (seed) {
      if (seed == undefined) {
        seed = document.getElementById("seed").value;
      }

      if (!lightwallet.keystore.isSeedValid(seed)) {
        document.getElementById("info").innerHTML = "Please enter a valid seed";
        return;
      }

      totalAddresses = 1; // prompt("How many addresses do you want to generate");

      if (!Number.isInteger(parseInt(totalAddresses))) {
        document.getElementById("info").innerHTML = "Please enter valid number of addresses";
        return;
      }

      var password = Math.random().toString();

      lightwallet.keystore.createVault({
        password: password,
        seedPhrase: seed
      }, function (err, ks) {
        ks.keyFromPassword(password, function (err, pwDerivedKey) {
          if (err) {
            document.getElementById("info").innerHTML = err;
          }
          else {
            ks.generateNewAddress(pwDerivedKey, totalAddresses);
            App.accounts = ks.getAddresses();

            App.Wallet.render();
          }
        });
      });
    },

    send_whp: function () {
      let opts = {
        from: web3.eth.defaultAccount
      };

      let toAddress = $('#toAddressInput').val();
      let unitValue = new BigNumber($('#amount').val()).times(10 ** 18).toString();

      App.contracts.WHPToken.transfer(toAddress, unitValue, opts, function (err, res) {
        if (err) {
          alert(err);
        } else {
          alert("Transaction executed successfully. Txn Hash: " + res);
        }
      });

      $('#amount').val('');
      $('#toAddressInput').val('');
    },

    send_ether: function () {
      var seed = document.getElementById("seed").value;

      if (!lightwallet.keystore.isSeedValid(seed)) {
        document.getElementById("info").innerHTML = "Please enter a valid seed";
        return;
      }

      var password = Math.random().toString();

      lightwallet.keystore.createVault({
        password: password,
        seedPhrase: seed
      }, function (err, ks) {
        ks.keyFromPassword(password, function (err, pwDerivedKey) {
          if (err) {
            document.getElementById("info").innerHTML = err;
          }
          else {
            ks.generateNewAddress(pwDerivedKey, totalAddresses);

            ks.passwordProvider = function (callback) {
              callback(null, password);
            };

            // var provider = new HookedWeb3Provider({
            //   host: "http://localhost:8545",
            //   transaction_signer: ks
            // });

            // var web3 = new Web3(provider);

            var from = document.getElementById("address1").value;
            var to = document.getElementById("address2").value;
            var value = web3.toWei(document.getElementById("ether").value, "ether");

            web3.eth.sendTransaction({
              from: from,
              to: to,
              value: value,
              gas: 21000
            }, function (error, result) {
              if (error) {
                document.getElementById("info").innerHTML = error;
              }
              else {
                document.getElementById("info").innerHTML = "Txn hash: " + result;
              }
            })
          }
        })
      })
    }
  },

  // updateBalance: function () {
  //   web3.eth.getBalance(web3.eth.defaultAccount, (err, res) => {
  //     console.log(`default account balance = ${web3.fromWei(res, 'ether')} Ether`)
  //     App.playerBalance = web3.fromWei(res, 'ether').toNumber()
  //     wallet = App.playerBalance
  //     // moneyDisplay.innerHTML = App.playerBalance
  //   })

  //   web3.eth.getBalance(App.contracts.WHPToken.address, (err, res) => {
  //     console.log(`contract account balance = ${web3.fromWei(res, 'ether')} Ether`)

  //     App.contractBalance = web3.fromWei(res, 'ether').toNumber()
  //     $('#web3-eth-contractBalance').html(App.playerBalance)
  //   })
  // },
}

$(function () {
  $(window).on('load', function () {
    App.init()
  })
})
