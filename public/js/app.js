App = {
  web3Provider: null,
  contracts: {},
  results: {},
  whpBalance: 0,

  contractBalance: 0,

  init: function () {
    return App.initWeb3()
  },

  initWeb3: function () {
    // Is there an injected web3 instance?
    if (typeof web3 !== 'undefined') {
      console.log('Using current web3 provider');
      App.web3Provider = web3.currentProvider
    } else {
      // If no injected web3 instance is detected, fall back to Ganache
      App.web3Provider = new Web3.providers.HttpProvider('http://localhost:8545')
    }

    web3 = new Web3(App.web3Provider)
    console.log('web3Provider=' + App.web3Provider)
    console.log('web3 api version = ' + web3.version.api)

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

      let addy = web3.eth.accounts;
      App.contracts.WHPToken.balanceOf(addy, function (err, res) {
        App.whpBalance = new BigNumber(res).div(10 ** 18);
        document.getElementById("whp-balance").innerHTML = App.whpBalance.toString();
        document.getElementById("whp-balance-big").innerHTML = App.whpBalance.toFormat(2);
      });

      return true
    })

    return App.bindEvents()
  },

  bindEvents: function () {
    // $(document).on('click', '#playImage', App.executeBet)

    App.accounts = web3.eth.accounts;
    console.log('accounts: ' + App.accounts);

    App.updateFromAddresses();

    // document.getElementById("toAddress").innerHTML = html;
    // document.getElementById("address").innerHTML = html;

    document.getElementById("seedForm").addEventListener("submit", function (e) {
      e.preventDefault();

      generate_addresses(document.getElementById("seed").value);

      $("#home").hide();
      $("#price").show();
    })

    document.getElementById("sendForm").addEventListener("submit", function (e) {
      e.preventDefault();

      let opts = {
        from: document.getElementById("fromAddress").options[document.getElementById("fromAddress").selectedIndex].value
      };
      
      let toAddress = document.getElementById("toAddressInput").value.trim() || document.getElementById("toAddress").value;
      let unitValue = new BigNumber(document.getElementById("amount").value).toString();

      App.contracts.WHPToken.transfer(toAddress, unitValue, opts, function (err, res) {
        alert("Transaction mined successfully. Txn Hash: " + res);
      });
    })
    
    // document.getElementById("contractBalanceForm").addEventListener("submit", function (e) {
    //   e.preventDefault();

    //   let instance = App.contracts.WHPToken;
    //   let owner = '0xE88915Ae42F77EBc12c0cF53Ffaffc495eD8F756';

    //   instance.balanceOf(owner, function (err, res) {
    //     let balance = new BigNumber(res).div(10 ** 18);
    //     alert("Remaining Supply is: " + balance.toFormat(18) + " WHP");
    //   });
    // })

    return App.generateKeys();
  },

  generateKeys: function () {
    generate_seed();
  },

  updateFromAddresses: function (addys) {
    alert(addys);
    App.addresses = addys;
    
    var html = "";
    for (var count = 0; count < App.accounts.length; count++) {
      html = html + "<option>" + App.accounts[count] + "</option>";
    }
    document.getElementById("fromAddress").innerHTML = html;
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
