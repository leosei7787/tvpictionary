window.onload = function() {
	channel(token);
	
//	drawSquare();
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
	$('#message-receiver').html('The serveur sent us :'+message.data);

	console.log($.parseJSON(message.data));
	drawCoordinates($.parseJSON(message.data));
	
};


drawCoordinates = function(coordinates) {
	var canvas = document.getElementById("canvas");
	var context = canvas.getContext("2d");

	context.beginPath();
	context.scale(1, 1);
	context.lineWidth = 1;

	context.strokeStyle = 'black';
	context.lineCap = 'round';
	context.lineJoin = 'round';

  var moveTo = false;
	
	$.each(coordinates,function(index,coordinate){
		/*if(index==0) {
			context.moveTo(coordinate.x, coordinate.y);					
		}*/
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

	});
	context.stroke();
	
};