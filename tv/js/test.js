$("body").ready(start);

function start(){
  $("#drawer").css({
    "width":"50px",
    "height":"50px",
    "background-color":"black"
  });
  
  $('#drawer').touch({
    animate: false,
    sticky: false,
    dragx: true,
    dragy: true,
    rotate: false,
    resort: false,
    scale: false
  });
}


