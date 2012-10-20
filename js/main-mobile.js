/**
 * Main Script for the Mobile client
 * @author : Leo SEI
 */

// On body loaded
$("body").ready(start);

// Starter function.
function start(){
  init_pen();
};

// Transmitter object
var Transmitter = {
  data : new Array(),
  cycle:Configuration.Transmitter.cycle,
  timer:null,
  radius : Configuration.Transmitter.radius,
  index : 0
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
      Transmitter.data[Transmitter.index] ={
        x:percentX,
        y:percentY
      };
      Transmitter.index ++ ;
    }
  }
  else{
    Transmitter.data[Transmitter.index] ={
      x:percentX,
      y:percentY
     };
    Transmitter.index ++ ;
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
  $.post(
    Configuration.Channel.url,
    {
      coordinates:JSON.stringify(buff)
    },
    function(data){
      console.log("Transmitted, received "+data);
    }
  );
  
}