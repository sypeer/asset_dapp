pragma solidity >=0.4.21 <0.6.0;

// Purchase artwork by GAN √
// Make offer on purchased canvas √
// Accept offer made on owned canvas √
// Metamorph two or more canvases to create a new piece

contract CanvasGallery {

  enum CanvasType {Original, Morphed}
  uint public canvasIndex;

  mapping (uint => Bidder) public highestOffer;

  mapping (address => mapping(uint => Canvas)) public galleries;
  mapping (uint => address payable) canvasIdInGallery;

  struct Canvas {
    uint id;
    string title;
    string imageLink;
    string descLink;
    uint startTime;
    uint price;
    CanvasType canvasType;
    address payable buyer;
  }

  struct Bidder {
    address payable bidder;
    uint bid;
  }

  constructor() public {
    canvasIndex = 0;
  }

  function addCanvas(string memory _title, string memory _imageLink, string memory _descLink, uint _startTime, uint _price, uint _canvasType) public {
    canvasIndex += 1;
    Canvas memory canvas = Canvas(canvasIndex, _title, _imageLink, _descLink, _startTime, _price, CanvasType(_canvasType), address(0));
    galleries[msg.sender][canvasIndex] = canvas;
    canvasIdInGallery[canvasIndex] = msg.sender;
  }

  function getCanvas(uint _canvasId) public view returns (uint, string memory, string memory, string memory, uint, uint, CanvasType, address) {
    Canvas memory canvas = galleries[canvasIdInGallery[_canvasId]][_canvasId];
    return (canvas.id, canvas.title, canvas.imageLink, canvas.descLink, canvas.startTime, canvas.price, canvas.canvasType, canvas.buyer);
  }

  function buy(uint _canvasId) payable public {
    Canvas memory canvas = galleries[canvasIdInGallery[_canvasId]][_canvasId];
    require(canvas.buyer == address(0));
    require(msg.value >= canvas.price);
    address payable owner = canvas.buyer;
    address payable buyer = msg.sender;
    owner.transfer(msg.value);
    canvas.buyer = msg.sender;
    galleries[canvasIdInGallery[_canvasId]][_canvasId] = canvas;
  }

  function makeOffer(uint _canvasId, uint _offer) public {
    Canvas memory canvas = galleries[canvasIdInGallery[_canvasId]][_canvasId];
    require(canvas.buyer != address(0) || canvas.buyer != msg.sender);
    if (highestOffer[canvas.id].bid < _offer) {
      Bidder memory bidder = Bidder(msg.sender, _offer);
      highestOffer[canvas.id] = bidder;
    }
  }

  function acceptOffer(uint _canvasId) payable public {
    Canvas memory canvas = galleries[canvasIdInGallery[_canvasId]][_canvasId];
    Bidder memory bidder = highestOffer[_canvasId];
    require(canvas.buyer == msg.sender);
    address payable owner = canvas.buyer;
    address payable buyer = bidder.bidder;
    owner.transfer(canvas.price);
    canvas.buyer = bidder.bidder;
    canvas.price = bidder.bid;
    galleries[canvasIdInGallery[_canvasId]][_canvasId] = canvas;
  }

}
