// Test file for  Canvas Solidity Contract

// Import Artifact
var CanvasGallery = artifacts.require('./CanvasGallery.sol');

contract('CanvasGallery', function(accounts) {

  // Assign accounts and variables
  const artist = accounts[0];
  const buyer = accounts[1];
  const price = web3.utils.toBN(5);
  const offer = web3.utils.toBN(6);

  // Initiate instance
  beforeEach(async function() {
    instance = await CanvasGallery.new();
    await instance.addCanvas('The Starry Night', 'link.ipfs', 'desc.ipfs', '1575813466', price, 0);
  });

  // Campaign addtion test
  it('Checking canvas addition', async function() {
    const canvas = await instance.getCanvas(1);
    assert.equal(canvas[1], 'The Starry Night', 'Canvas was not added correctly, check canvas addition method');
  });

  // Purchase test
  it('Checking canvas purchase', async function() {
    await instance.buy(1, {from: buyer, value: offer});
    const canvas = await instance.getCanvas(1);
    assert.equal(canvas[7], buyer, 'Owner of canvas is incorrect, check canvas buy method');
  });

});
