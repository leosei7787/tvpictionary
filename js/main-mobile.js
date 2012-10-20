/**
 * Main Script for the Mobile client
 * @author : Leo SEI
 */

// On body loaded
$("body").ready(start);

// Starter function.
function start(){
  init_pen();
  init_event();
};

// Transmitter object
var Transmitter = {
  data : new Array(),
  cycle:Configuration.Transmitter.cycle,
  timer:null,
  radius : Configuration.Transmitter.radius
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


Transmitter.start_timer = function(){
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
  var Url = Configuration.Channel.remoteUrl;
  if( Configuration.Channel.debug ){
    Url = Configuration.Channel.localUrl;
  } 
  $.post(
    Url,
    {
      coordinates:JSON.stringify(buff)
    },
    function(data){
      console.log("Transmitted, received "+data);
    }
  );
  
}
