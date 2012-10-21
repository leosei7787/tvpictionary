window.onload = function() {
  try{
  channel(token);
  initCanvas();
  }
  catch(err){}

	// drawSquare();
	Url = window.location.href;

	console.log(Url.split('/'));
	hash = Url.split('/')[3];
	// players.push(Url.split('/')[2]);

	$('#player1').children('#qr-code-player1').html(
			'<img src="http://www.sparqcode.com/qrgen?qt=url&data='
					+ formatUrl('player1') + '&width=128"/>')
	$('#player2').children('#qr-code-player2').html(
			'<img src="http://www.sparqcode.com/qrgen?qt=url&data='
					+ formatUrl('player2') + '&width=128"/>')

  // Add focus to enter button
  $("#startButton").focus();

};

var gameState = "NEW_GAME";
var TIMER = 30000;
var Url;
var players = [];
var currentPlayer;
var interval;
var startTime;
var hash;

var canvas;
var context;
var moveTo = false;
initCanvas = function() {
	canvas = $("canvas");
	context = canvas[ 0 ].getContext( "2d" );
  resetGame();
	context.scale(1, 1);
	context.lineWidth = 1;

	context.strokeStyle = '#00FF00';
	context.lineCap = 'round';
	context.lineJoin = 'round';

}

function resetGame(){
  clearInterval(interval);
  context.beginPath();
  $("#chrono").html("30");
  $('#timer-current').css('width',  $("#timer").width()+'px');
  try{
    clearInterval(interval);
  }
  catch(err){}
  context.clearRect(0, 0, canvas.width(), canvas.height());
}

function channel(token) {
	if (token != undefined) {
		channel = new goog.appengine.Channel(token);
		socket = channel.open();
		socket.onopen = onOpened;
		socket.onmessage = onMessage;
		// socket.onerror = onError;
		// socket.onclose = onClose;
	}
};

sendMessage = function(path, opt_param) {
	// path += '?g=test';
	if (opt_param) {
		path += '&' + opt_param;
	}
	var xhr = new XMLHttpRequest();
	xhr.open('POST', path, true);
	xhr.send();
};

function onOpened() {
	// Sent the readyAck post to server
	$.post(Url, {}, function(data) {
		console.log("connection opened");
	});
}

onMessage = function(message) {
	console.log('Message received from Server')
	console.log($.parseJSON(message.data));

	switch ($.parseJSON(message.data).cmd) {
	case 'JOIN':
		setPlayer($.parseJSON(message.data));
		break;
	case 'PLAYER_READY':
		setPlayerToPlay($.parseJSON(message.data).player);
		break;
	case 'PLAYER_START':
		startGame($.parseJSON(message.data));
		break;
  case 'PLAYER_FOUND':
    resetGame();
    break;
	case 'DRAW':
		drawCoordinates($.parseJSON($.parseJSON(message.data).data));
		break;
	default:
		console.log('Unknown message');
	}

};

formatUrl = function(player) {
	UrlSplit = Url.split('/');
	UrlSplit[UrlSplit.length - 1] = 'mobile';
	UrlSplit.push(player);
	UrlString = "";
	for (i = 0; i < UrlSplit.length; i++) {
		UrlString += UrlSplit[i] + '/';
	}
	;
	console.log(UrlString);
	return UrlString;
}

setPlayer = function(message) {
	players.push(message);
	if (players.length == 1) {
		$('#player' + players.length).children(
				'#avatar-player' + players.length).html(
				'<img src="/images/avatar-actif_128x150.png"/>');
	} else {
		$('#player' + players.length).children(
				'#avatar-player' + players.length).html(
				'<img src="/images/avatar-passif_128x150.png"/>');
	}
	$('#player' + players.length).children('#team1_name' + players.length)
			.html(players[players.length - 1] + ' : 17 points')
};

setPlayerToPlay = function(message) {
	if(players.length == 2) {
	$('.player').children(
			'.avatar-player').html(
			'<img src="/images/avatar-passif_128x150.png"/>');
	currentPlayer = message;
		$('#'+message).children(
				'#avatar-' + message).html(
				'<img src="/images/avatar-actif_128x150.png"/>');
	}
};

startGame = function(message) {
	startTime = $.now();
	setTimeout(endGame, TIMER);
	interval = setInterval(function() {
		refresh();
	}, 1000);

	$("#chrono").html("30");
};

refresh = function() {
	// compute width
	var width = (1 - ($.now() - startTime) / TIMER) * $("#timer").width();
	// update evolution bar width
	$('#timer-current').css('width', width + 'px');
	
	// compute time left
	var leftTime = Math.round( (TIMER - ($.now() - startTime) )/1000);
  if(leftTime < 0){
    resetGame();
  }
  
  // display time left
	var leftTimeString = (leftTime<10 ? '0'+leftTime : leftTime);
	$("#chrono").html(leftTimeString);
}

endGame = function() {
	$.post(Url, {
		'playerstop' : 'true'
	}, function(data) {
		console.log("End Game sent");
	});
	clearInterval(interval);
	//clean Canvas with a little delay to avoid redrawing late points
	setTimeout(resetGame,500);
	
}

drawCoordinates = function(coordinates) {
	var interval = Configuration.Transmitter.cycle / coordinates.length;
	$.each(coordinates, function(index, coordinate) {
		// setTimeout(function(){ drawCoordinate(coordinate);}, (index *
		// interval));
		drawCoordinate(coordinate);
	});
}

drawCoordinate = function(perMile) {
  if (perMile.x == -1 && perMile.y == -1) {
    moveTo = true;
    return;
  }
  
	var coordinate = {
		x : Math.round((perMile.x * canvas.width()) / 1000),
		y : Math.round((perMile.y * canvas.height()) / 1000),
	}
	if (moveTo) {
		context.moveTo(coordinate.x, coordinate.y);
		// console.log("MoveTo");
		moveTo = false;
	} else {
		// console.log("lineTo");
		// console.log(coordinate.x+' - '+coordinate.y);
		context.lineTo(coordinate.x, coordinate.y);
	}

	context.stroke();

};