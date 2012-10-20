window.onload = function() {
	channel(token);
	initCanvas();
//	drawSquare();
	Url = window.location.href;

};

var gameState = "NEW_GAME";
var TIMER = 30000;
var Url;
var currentPlayer;
var interval;
var startTime;

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



function onOpened(){
	  // Sent the readyAck post to server
	  $.post(
	    Url,
	    {},
	    function(data){
	      console.log("connection opened");
	    }
	  );
	}

onMessage = function(message) {
	console.log('Message received from Server')
	console.log($.parseJSON(message.data));
	
	switch($.parseJSON(message.data).cmd)
	{
	case 'JOIN':
		setPlayer($.parseJSON(message.data));
		break;
	case 'PLAYER_READY':
		setPlayerToPlay($.parseJSON(message.data).player);
		break;
	case 'PLAYER_START':
		startGame($.parseJSON(message.data));
		break;
	case 'DRAW':
		drawCoordinates($.parseJSON($.parseJSON(message.data).data));
		break;
	default:
		console.log('Unknown message');
	}
	
};

setPlayer = function(message) {
	
};

setPlayerToPlay = function(message) {
	currentPlayer = message;
	console.log(currentplayer);
};

startGame = function(message) {
	startTime = $.now();
	setTimeout(endGame, TIMER);
	interval = setInterval(function(){refresh();}, 1000);
	console.log('Et c\'est parti pour le jeu!')
};

refresh = function() {
	console.log('On met � jour');
	var width = (1-($.now()-startTime)/TIMER) * 300;
	$('#timer-current').css('width',width+'px');
}

endGame = function() {
	  $.post(
			    Url,
			    {
			    	'playerstop':'true'
			    	},
			    function(data){
			      console.log("connection opened");
			    });
	  clearInterval(interval);
}

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
//	  console.log("MoveTo");
	  moveTo = false;
	}
	else{
//    console.log("lineTo");
//    console.log(coordinate.x+' - '+coordinate.y);
    context.lineTo(coordinate.x, coordinate.y);		        
	}
	
	context.stroke();
	
};