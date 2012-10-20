/**
 * Main Script for the Mobile client
 * @author : Leo SEI
 */
//Global url
var Url;


// On body loaded
$("body").ready(start);

// Starter function.
function start(){
  //context switcher to stop
  switch_context("stop");
  channel(token);
  init_pen();
  
  // Init url
  Url = window.location.href
  


};


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
  var cmd = JSON.parse(Msg.data).cmd;
  console.log(cmd);
  switch ( cmd ){
    case "PLAYER_READY":
      switch_context("ready");
      break;
    case "PLAYER_STOP":
      switch_context("stop");
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
      $("#context_"+state).css("z-index","3");
    }
    else{
      $("#context_"+s).css("z-index","2");
    }
  });
}







