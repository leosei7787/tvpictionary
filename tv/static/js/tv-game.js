window.onload = function() {
	try {
		channel(token);
		initCanvas();
	} catch (err) {
	}

	Url = window.location.href;

	hash = Url.split('/')[3];

	newPlayer('player1');
	
	avatarActif = new Image();
	avatarActif.src='/tv/images/avatar-actif_128x150.png';
	avatarPassif = new Image();
	avatarPassif.src = '/tv/images/avatar-passif_128x150.png';

};

newPlayer = function(player) {
	$('#players')
			.append(
					'<div class="player" id="'
							+ player
							+ '"><div class="team_name">'
							+ player
							+ '</div><div class="qr-code"><a href="'
							+ formatUrl(player)
							+ '" target="_blank"></a></div><div class="avatar"></div></div>');

	$('#' + player).children('.avatar').css('background-image',
			'url(\'/tv/images/avatar-offline_128x150.png\')');
	$('#' + player).children('.qr-code').css(
			'background-image',
			'url(\'http://www.sparqcode.com/qrgen?qt=url&data='
					+ formatUrl(player)
					+ '&width=160&bgcol=000000&col=FFFFFF\')');

	$.each($('.player'), function(index, player) {
		var ratio = (index + 1) / ($('.player').length + 1);
		var ratioInPx = ratio * $(document).height();
		var position = ratioInPx - $('#' + player.id).height() / 2;

		$('#' + player.id).css('top', position);
	});

}

formatUrl = function(player) {
	UrlSplit = Url.split('/');
	UrlSplit[UrlSplit.length - 1] = 'mobile';
	UrlSplit.push(player);
	UrlString = "";
	for (i = 0; i < UrlSplit.length; i++) {
		UrlString += UrlSplit[i] + '/';
	}
	;
	return UrlString;
}

var gameState = "NEW_GAME";
var TIMER = 30000;
var Url;
var players = [];
var currentPlayer;
var interval;
var startTime;
var hash;

var avatarActif;
var avatarPassif;

var canvas;
var context;
var moveTo = false;
initCanvas = function() {
	canvas = $("canvas");
	context = canvas[0].getContext("2d");
	resetGame();
	context.scale(1, 1);
	context.lineWidth = 1;

	context.strokeStyle = '#00FF00';
	context.lineCap = 'round';
	context.lineJoin = 'round';

}

function channel(token) {
	if (token != undefined) {
		channel = new goog.appengine.Channel(token);
		socket = channel.open();
		socket.onopen = onOpened;
		socket.onmessage = onMessage;
		// socket.onerror = onError;
		// socket.onclose = onClose;
	} else {
		alert('Error on channel opening. Please start again ...');
	}
};

function onOpened() {
	// Sent the readyAck post to server
	$.post(Url, {}, function(data) {
		console.log("Connection opened");
	});
}

onMessage = function(message) {
	// Action varies according to CMD received
	switch ($.parseJSON(message.data).cmd) {
	case 'JOIN':
		// New player in the game
		console.log($.parseJSON(message.data).player+' joined the game');
		setPlayer($.parseJSON(message.data).player);
		break;
	case 'PLAYER_READY':
		// ??
		console.log($.parseJSON(message.data).player+' is ready to play');
		setPlayerToPlay($.parseJSON(message.data).player);
		break;
	case 'PLAYER_START':
		// Player starts drawing
		console.log($.parseJSON(message.data).player+' started to play');
		startGame($.parseJSON(message.data));
		break;
	case 'PLAYER_FOUND':
		// The players found the word
		console.log($.parseJSON(message.data).player+' founded the word');
		playerfound();
		break;
	case 'DRAW':
		// Draw the received coordinates
		console.log($.parseJSON(message.data).player+' is drawing');
		drawCoordinates($.parseJSON($.parseJSON(message.data).data));
		break;
	default:
		console.log('Unknown message');
	}

};

isNewPlayer = function(newPlayer) {
	for (index in players) {
		if (players[index] == newPlayer) {
			return false;
		}
	}
	return true;
}

setPlayer = function(player) {
	if (isNewPlayer(player)) {
		players.push(player);
		newPlayer('player' + (players.length + 1));
	}
	$('#' + player).children('.avatar').css('background-image',
			'url(\''+avatarActif.src+'\')');

	$('#' + player).animate({
		left : -128
	}, 'slow');
	$('#' + player).click(function() {
		if ($('#' + this.id).css('left') == '-128px') {
			$('#' + this.id).animate({
				left : 0
			}, 'slow');
		} else {
			$('#' + this.id).animate({
				left : -128
			}, 'slow');
		}
	});

};

setPlayerToPlay = function(playerToPlay) {

	for (index in players) {

		if (players[index] == playerToPlay) {
			$('#' + players[index]).children('.avatar').css('background-image',
					'url(\'/tv/images/avatar-actif_128x150.png\')');
		} else {
			$('#' + players[index]).children('.avatar').css('background-image',
					'url(\'/tv/images/avatar-passif_128x150.png\')');
		}
	}
};

startGame = function(message) {
	
	$.each($('.player'),function(index,player) {
		if(isNewPlayer(player.id)) {
			$('#'+player.id).remove();
		}
	});
	
	startTime = $.now();
	interval = setInterval(function() {
		refresh();
	}, 1000);

	$("#chrono").html("30");
};

refresh = function() {
	// compute time left
	var leftTime = Math.round((TIMER - ($.now() - startTime)) / 1000);
	if (leftTime < 1) {
		endGame();
	}

	// display time left
	var leftTimeString = (leftTime < 10 ? '0' + leftTime : leftTime);
	$("#chrono").html(leftTimeString);
}

function playerfound() {
	endGame();
}

endGame = function() {
	$.post(Url, {
		'playerstop' : 'true'
	}, function(data) {
		console.log("End Game sent");
	});
	clearInterval(interval);
	// clean Canvas with a little delay to avoid redrawing late points
	setTimeout(resetGame, 500);

};

function resetGame() {
	clearInterval(interval);
	context.beginPath();
	$("#chrono").html("30");
	$('#timer-current').css('width', $("#timer").width() + 'px');
	try {
		clearInterval(interval);
	} catch (err) {
	}
	context.clearRect(0, 0, canvas.width(), canvas.height());
}

drawCoordinates = function(coordinates) {
	var interval = Configuration.Transmitter.cycle / coordinates.length;
	$.each(coordinates, function(index, coordinate) {
		// setTimeout(function(){ drawCoordinate(coordinate);}, (index *
		// interval));
		drawCoordinate(coordinate);
	});
};

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