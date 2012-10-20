window.onload = function() {
	channel(token);
	
	
	drawSquare();
	$('#canvas').click(clickCanvas);
};

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
	console.log(message);
	$('#message-receiver').html('The serveur sent us :'+message.data);
	
	drawCoordinates(message);
	
};

clickCanvas = function() {
	console.log('clicked');
	sendMessage('tv');
};

drawCoordinates = function(coordinates) {
	console.log('Je dessine les coordonnes :'+coordinates);
};

function drawSquare() {
	var canvas = document.getElementById("canvas");
	var context = canvas.getContext("2d");

	context.scale(2, 2);
	context.lineWidth = 1;

	context.strokeStyle = 'black';
	context.lineCap = 'round';
	context.lineJoin = 'round';

	context.beginPath();
	context.moveTo(10, 10);
	context.lineTo(10, 40);
	context.lineTo(40, 40);
	context.stroke();
	context.beginPath();

	context.strokeStyle = 'blue';
	context.moveTo(40, 40);
	context.lineTo(40, 10);
	context.lineTo(10, 10);
	context.stroke();
};