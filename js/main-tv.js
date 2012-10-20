window.onload = function() {
	channel(token);
	initCanvas();
//	drawSquare();
};

var gameState = "NEW_GAME";

var canvas;
var context;
var moveTo = false;
initCanvas = function(){
  canvas = document.getElementById("canvas");
  context = canvas.getContext("2d");
  
  context.beginPath();
  context.scale(1, 1);
  context.lineWidth = 1;

  context.strokeStyle = 'white';
  context.lineCap = 'round';
  context.lineJoin = 'round';
  
}

function channel(token) {
	channel = new goog.appengine.Channel(token);
	socket = channel.open();
	socket.onopen = onOpened;
	socket.onmessage = onMessage;
//	socket.onerror = onError;
//	socket.onclose = onClose;
};

sendMessage = function(path, opt_param) {
//	path += '?g=test';
	if (opt_param) {
		path += '&' + opt_param;
	}
	var xhr = new XMLHttpRequest();
	xhr.open('POST', path, true);
	xhr.send();
};

onOpened = function() {
	connected = true;
	sendMessage('tv');
	// updateBoard();
	console.log('connection opened');
};

onMessage = function(message) {
	conole.log('Message received from Server')
	console.log($.parseJSON(message.data));
	
	switch($.parseJSON(message.data).cmd)
	{
	case 'JOIN':
		setPlayer($.parseJSON(message.data));
		break;
	case 'PLAYER_READY':
		setPlayerToPlay($.parseJSON(message.data));
		break;
	case 'PLAYER_START':
		startGame($.parseJSON(message.data));
		break;
	case 'DRAW':
		drawCoordinates($.parseJSON(message.data));
		break;
	default:
		console.log('Unknown message');
	}
	
	drawCoordinates($.parseJSON(message.data));
	
};

setPlayer = function(message) {
	
};

setPlayerToPlay = function(message) {
	
};

startGame = function(message) {
	
};

drawCoordinates = function(coordinates){
  var interval = Configuration.Transmitter.cycle / coordinates.length;
  $.each(coordinates,function(index,coordinate){
    //setTimeout(function(){ drawCoordinate(coordinate);}, (index * interval));
    drawCoordinate(coordinate);
  });
}


drawCoordinate = function(coordinate) {
	if( coordinate.x == -1 && coordinate.y == -1){
	  moveTo = true;
	  return;
	}
	if( moveTo){
	  context.moveTo(coordinate.x, coordinate.y);
	  console.log("MoveTo");
	  moveTo = false;
	}
	else{
    console.log("lineTo");
    console.log(coordinate.x+' - '+coordinate.y);
    context.lineTo(coordinate.x, coordinate.y);		        
	}
	
	context.stroke();
	
};