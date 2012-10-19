window.onload = function() {
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