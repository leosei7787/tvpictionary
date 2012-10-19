/** 
 * Pen.js
 * Based on the work of Ben Nadel
 * http://www.bennadel.com/blog/1867-Drawing-On-The-iPhone-Canvas-With-jQuery-And-ColdFusion.htm
 * @Author : Leo SEI
 */

// Global variables
var canvas;
var pen;
var lastPenPoint;
var isIphone;


// I handle the touch end event. Here, we are basically
// just unbinding the move event listeners.
var onTouchEnd = function( event ){
  // Unbind event listeners.
  canvas.unbind((isIPhone ? "touchmove" : "mousemove"));
  
  // Unbind event listeners.
  canvas.unbind((isIPhone ? "touchend" : "mouseup"));
};
// I get appropriate event object based on the client
// environment.
var getTouchEvent = function( event ){
  // Check to see if we are in the iPhont. If so,
  // grab the native touch event. By its nature,
  // the iPhone tracks multiple touch points; but,
  // to keep this demo simple, just grab the first
  // available touch event.
  return(isIPhone ? window.event.targetTouches[ 0 ] :event);
};

// I take the event X,Y and translate it into a local
// coordinate system for the canvas.
var getCanvasLocalCoordinates = function( pageX, pageY ){
  // Get the position of the canvas.
  var position = canvas.offset();
  console.log("pageX"+pageX+" position LEFt"+position.left+", pageY"+pageY+" position TOp"+position.top);
  console.log((pageX - position.left)+","+(pageY - position.top));
  // Translate the X/Y to the canvas element.
  return({
    x: (pageX - position.left),
    y: (pageY - position.top)
  });
};

// I handle the touch start event. With this event,
// we will be starting a new line.
var onTouchStart = function( event){
  // Get the native touch event.
  var touch = getTouchEvent( event );
   
  // Get the local position of the touch event
  // (taking into account scrolling and offset).
  var localPosition = getCanvasLocalCoordinates(
    touch.pageX,
    touch.pageY
  );
   
  // Store the last pen point based on touch.
  lastPenPoint = {
    x: localPosition.x,
    y: localPosition.y
  };
   
  // Since we are starting a new line, let's move
  // the pen to the new point and beign a path.
  pen.beginPath();
  pen.moveTo( lastPenPoint.x, lastPenPoint.y );
  
  // Now that we have initiated a line, we need to
  // bind the touch/mouse event listeners.
  canvas.bind( (isIPhone ? "touchmove" : "mousemove"), onTouchMove);
   
  // Bind the touch/mouse end events so we know
  // when to end the line.
  canvas.bind((isIPhone ? "touchend" : "mouseup"), onTouchEnd );
};

// I handle the touch move event. With this event, we
// will be drawing a line from the previous point to
// the current point.
var onTouchMove = function( event ){
  // Get the native touch event.
  var touch = getTouchEvent( event );
   
  // Get the local position of the touch event
  // (taking into account scrolling and offset).
  var localPosition = getCanvasLocalCoordinates(
  touch.pageX,
  touch.pageY
  );
 
  // Store the last pen point based on touch.
  lastPenPoint = {
    x: localPosition.x,
    y: localPosition.y
    };
 
  // Draw a line from the last pen point to the
  // current touch point.
  pen.lineTo( lastPenPoint.x, lastPenPoint.y );
   
  // Render the line.
  pen.stroke();
 }

// When the window has loaded, scroll to the top of the
// visible document.
jQuery( window ).load(
  function(){
    // When scrolling the document, using a timeout to
    // create a slight delay seems to be necessary.
    // NOTE: For the iPhone, the window has a native
    // method, scrollTo().
    setTimeout(
      function(){
        window.scrollTo( 0, 0 );
      },
      50
      );
   }
);

// When The DOM loads, initialize the scripts.
var init_pen = function(){
  // Global variable linking
  canvas = $( "canvas" );
  pen = canvas[ 0 ].getContext( "2d" );
  lastPenPoint = null;
  isIPhone = (new RegExp( "iPhone", "i" )).test(navigator.userAgent);

  // Bind the touch start event to the canvas. With
  // this event, we will be starting a new line. The
  // touch event is NOT part of the jQuery event object.
  // We have to get the Touch even from the native
  // window object.
  canvas.bind(
    (isIPhone ? "touchstart" : "mousedown"),
    function( event ){
      // Pass this event off to the primary event
      // handler.
      onTouchStart( event );
       
      // Return FALSE to prevent the default behavior
      // of the touch event (scroll / gesture) since
      // we only want this to perform a drawing
      // operation on the canvas.
      return( false );
    }
  );

}
 