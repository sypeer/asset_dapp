import Web3 from "web3";
import canvasGalleryArtifact from "../../build/contracts/CanvasGallery.json";

var ipfsClient = require('ipfs-http-client');
var ipfs = ipfsClient('127.0.0.1', '5001', {protocol: 'http'});
var reader;

const App = {
  web3: null,
  account: null,
  instance: null,

  start: async function() {
    const { web3 } = this;

    try {
      // get contract instance
      const networkId = await web3.eth.net.getId();
      const deployedNetwork = canvasGalleryArtifact.networks[networkId];
      this.instance = new web3.eth.Contract(
        canvasGalleryArtifact.abi,
        deployedNetwork.address,
      );

      // get accounts
      const accounts = await web3.eth.getAccounts();
      this.account = accounts[0];

      if ($('#canvas-details').length > 0) {
        let canvasId = new URLSearchParams(window.location.search).get('id');
        this.renderCanvasDetails(canvasId);
      } else {
        this.renderGallery();
      };

      // Initiate bidder array
      const highestBidders = [];

      $('#buy-now').submit(function(event) {
        $('#msg').hide();
        var sendAmount = $('#buy-now-price').val();
        var canvasId = $('#canvas-id').val();
        App.instance.methods.buy(canvasId).send({value: sendAmount, from: App.account, gas: 4700000});
        $('#msg').show();
        $('#msg').html('Purchase Successful');
        event.preventDefault();
      });

      $('#make-offer').submit(function(event) {
        $('#msg').hide();
        var sendOffer = $('#offer').val();
        var canvasId = $('#canvas-id').val();
        highestBidders.push([canvasId, App.account, sendOffer]);
        //App.instance.methods.makeOffer(canvasId, sendOffer).send({value: App.web3.utils.toWei(sendOffer.toString(), 'ether'), from: App.account, gas: 4700000}); // Change to JS array highestBidders
        $('#msg').show();
        $('#msg').html('Offer Sent');
        console.log(highestBidders);
        event.preventDefault();
      });

      $('#accept-offer').submit(function(event) {
        $('#msg').hide();
        var offer = $('#offer').val();
        var canvasId = $('#canvas-id').val();
        App.instance.methods.acceptOffer(canvasId).send({value: App.web3.utils.toWei(offer.toString(), 'ether'), from: highestBidders[canvasId][1], gas: 4700000});
        //App.instance.methods.acceptOffer(canvasId).send({from: App.account, gas: 4700000}); // Read account from JS array highestBidders
        $('#msg').show();
        $('#msg').html('Offer Accepted');
        event.preventDefault();
      });

    } catch (error) {
      console.error("Could not connect to contract or chain.");
    }
  },

  renderGallery: async function() {
    const { canvasIndex } = this.instance.methods;
    var count = await canvasIndex().call();
    for(var i=1; i<=count; i++) {
      this.renderCanvas(i);
    };
  },

  renderCanvas: async function(canvas) {
    const { getCanvas } = this.instance.methods;
    var f = await getCanvas(canvas).call();
    console.log(f);
    const { highestOffer } = this.instance.methods;
    var o = await highestOffer(1).call();
    console.log(o.bidder);
    let node = $("<div/>");
    node.addClass('col-sm-3 text-center col-margin-bottom-1 product');
    node.append("<img src='http://localhost:8080/ipfs/" + f[2] +"' />'");
    node.append('<div class="title">' + f[1] + '</div>');
    if (f[7] === '0x0000000000000000000000000000000000000000') {
      node.append('<div> Price: ' + displayPrice(f[5]) + '</div>');
    } else {
      node.append('<div> Price: Ξ' + f[5] + '</div>');
    };
    node.append("<a href='canvas.html?id=" + f[0] + "'>Details</div>");
    if(f[7] === '0x0000000000000000000000000000000000000000') {
      $("#canvas-list").append(node);
    } else {
      $("#purchased-canvases").append(node);
    };
  },

  renderCanvasDetails: async function(canvas) {
    const { getCanvas } = this.instance.methods;
    var c = await getCanvas(canvas).call();
    console.log(c[1]);
    $('#canvas-title').html(c[1]);
    $('#canvas-image').html("<img width='400' src='http://localhost:8080/ipfs/" + c[2] + "' />'");
    $('#canvas-price').html("Price: " + displayPrice(c[5]))
    /*if (c[7] === '0x0000000000000000000000000000000000000000') {
        $('#canvas-price').html("Price: " + displayPrice(c[5]));
    } else {
        $('#canvas-price').html("Price: Ξ" + c[5]);
    }*/
    $('#canvas-id').val(c[0]);
    $('#buy-now-price').val(c[5]);
    const { highestOffer } = this.instance.methods;
    var o = await highestOffer(c[0]).call();
    console.log(o);
    $('#highest-offer').html("Highest Offer: Ξ" + highestBidders[val(c[0])]);
    //$('#highest-offer').html("Highest Offer: Ξ" + o.bid);
    if(c[7] === '0x0000000000000000000000000000000000000000') {
      $('#make-offer').hide();
      $('#highest-offer').hide();
      $('#accept-offer').hide();
    } else if (c[7] === App.account) {
      $('#make-offer').hide();
      $('#buy-now').hide();
    } else {
      $('#buy-now').hide();
      $('#highest-offer').hide();
      $('#accept-offer').hide();
    };
  },

};

function displayPrice(amt) {
  return 'Ξ' + App.web3.utils.fromWei(amt.toString(), 'ether');
};

window.App = App;

window.addEventListener("load", function() {
  if (window.ethereum) {
    // use MetaMask's provider
    App.web3 = new Web3(window.ethereum);
    window.ethereum.enable(); // get permission to access accounts
  } else {
    console.warn(
      "No web3 detected. Falling back to http://127.0.0.1:8545. You should remove this fallback when you deploy live",
    );
    // fallback - use your fallback strategy (local node / hosted node + in-dapp id mgmt / fail)
    App.web3 = new Web3(
      new Web3.providers.HttpProvider("http://127.0.0.1:8545"),
    );
  }

  App.start();
});
