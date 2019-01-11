

function initialize(DOC){
  console.log(DOC);
  var canvas = DOC.getElementByID("painter");
  if (!canvas){
    throw new Exception("DOM Missing painter canvas.");
  }
  var ctx = canvas.getContext("2d");
  if (!ctx){
    throw new Exception("Failed to obtain canvas context.");
  }
}


//console.log(document.getElementByID("painter"));
//initialize(document);
