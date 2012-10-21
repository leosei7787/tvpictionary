/**
 * Main Script for the Mobile client
 * @author : Leo SEI
 */
//Global url
var Url;


// On body loaded
$("body").ready(on_load);

// Starter function.
function on_load(){
  ui_init();
  channel(token);
  init_pen();
  
  // Init url
  Url = window.location.href

};


function start( event ){
  $.post(
    Url,
    {"playerstart":"true"},
    function(data){
      switch_context("start");
    }
  )
}

function found ( event ){
  $.post(
    Url,
    {"playerfound":"true"},
    function(data){
      // do nothing and wait for events
    }
  ) 
}

/**** CHANNEL MANAGEMENT **/
function channel(token) {
  channel = new goog.appengine.Channel(token);
  socket = channel.open();
  socket.onopen = onOpened;
  socket.onmessage = onMessage;
//  socket.onerror = onError;
//  socket.onclose = onClose;
};

function onOpened(){
  // Sent the readyAck post to server
  $.post(
    Url,
    {"readyAck":"true"},
    function(data){
      console.log("acked");
    }
  );
}

function onMessage( Msg ){
  var raw = JSON.parse(Msg.data);
  var cmd = raw.cmd;
  console.log(cmd);
  switch ( cmd ){
    case "PLAYER_READY":
      switch_context("ready");
      display_keyword( raw.data.keyword );
      break;
    case "PLAYER_STOP":
      switch_context("stop");
      display_keyword( raw.data.keyword );
      break;
  }
}

/** TRANSMITTER MANAGEMENT **/

// Transmitter object
var Transmitter = {
  data : new Array(),
  cycle:Configuration.Transmitter.cycle,
  timer:null,
  radius : Configuration.Transmitter.radius,
  paketNumber : 0
}

// Transmitter push_data
Transmitter.push_data = function( percentX, percentY ){
  var length = Transmitter.data.length;
  if(length > 1){
    var oldX = Transmitter.data[ (length-1) ].x;
    var oldY = Transmitter.data[ (length-1) ].y;

    var radius = Math.sqrt( Math.pow((oldY - percentY),2) + Math.pow((oldX - percentX),2));
    //console.log("radius "+radius);
    if( radius > Transmitter.radius){
      Transmitter.data.push({
        x:percentX,
        y:percentY
      });
    }
  }
  else{
    Transmitter.data.push({
      x:percentX,
      y:percentY
    });
  }
  

}

Transmitter.push_up = function(){
  Transmitter.data.push({
    x:-1,
    y:-1
  });
}

Transmitter.start_timer = function(){
  Transmitter.push_up();
  Transmitter.timer = setInterval(
    function(){
      Transmitter.flush();
    },
    Transmitter.cycle
  );
}

Transmitter.stop_timer = function(){
  // flush all remaining data
  Transmitter.flush();
  clearInterval(Transmitter.timer)
}

Transmitter.flush = function(){
  if(Transmitter.data.length == 0){
    return;
  }
  console.log("Transmitted "+Transmitter.data.length);
  // Buffer of Data
  var buff = Transmitter.data;
  
  // Reset Transmitter data array
  Transmitter.data = new Array();
  //console.log (buff);
  // Push Data
  $.post(
    Url,
    {
      coordinates:JSON.stringify(buff)
    },
    function(data){
      console.log("Transmitted, received "+data);
      Transmitter.paketNumber ++;
    }
  );
}

/*** UI MANAGEMENT **/

function switch_context( state ){
  var states = ['ready','start','stop'];
  console.log("switcher to "+state);
  $.each(states,function(index,s){
    if( s == state ){
      $("#context_"+state).css("display","block");
    }
    else{
      $("#context_"+s).css("display","none");
    }
  });
  
  // Clean canvas
  try{
    pen.clearRect(0, 0, canvas.width(), canvas.height());  
  }
  catch(err){}
  
}


function ui_init(){
  //context switcher to stop
  //switch_context("stop");
  bind_touch();
}

function bind_touch(){
   //Start button linking
   $("#startButton").bind(
    (isMobile ? "touchstart" : "mousedown"),
    function( event ){
      // Pass this event off to the primary event
      // handler.
      start( event );
       
      // Return FALSE to prevent the default behavior
      // of the touch event (scroll / gesture) since
      // we only want this to perform a drawing
      // operation on the canvas.
      return( false );
    }
  );
  
  //Found Button linking
   $("#foundButton").bind(
    (isMobile ? "touchstart" : "mousedown"),
    function( event ){
      // Pass this event off to the primary event
      // handler.
      found( event );
       
      // Return FALSE to prevent the default behavior
      // of the touch event (scroll / gesture) since
      // we only want this to perform a drawing
      // operation on the canvas.
      return( false );
    }
  );
  
}

function display_keyword( keyword ){
  $(".context_keyword_value").html(keyword);
  console.log(keyword);
}





