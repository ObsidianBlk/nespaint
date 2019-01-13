

function initialize(DOC){
  console.log(DOC);
  var canvas = DOC.getElementById("painter");
  if (!canvas){
    throw new Error("DOM Missing painter canvas.");
  }
  var ctx = canvas.getContext("2d");
  if (!ctx){
    throw new Error("Failed to obtain canvas context.");
  }
}


//console.log(document.getElementByID("painter"));
initialize(document);
