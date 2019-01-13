import {NESPainter} from "/app/js/NESPainter.js";
import {NESPalette} from "/app/js/NESPalette.js";

function initialize(DOC){
  var nespainter = new NESPainter(DOC.getElementById("painter"));
  //if (!canvas){
  //  throw new Error("DOM Missing painter canvas.");
  //}
  //var ctx = canvas.getContext("2d");
  //if (!ctx){
  //  throw new Error("Failed to obtain canvas context.");
  //}

  console.log(nespainter.scale);
  nespainter.scale_up(5);
  console.log(nespainter.scale);

  var nespal = new NESPalette();
  nespal.set_palette([
    44,
    11,12,13,
    54,23,43,
    23,18,11,
    4,8,60,
    63,0,11,
    0,15,14,
    9,0,32,
    5,10,20
  ]);
  console.log(nespal.to_asm());
}


//console.log(document.getElementByID("painter"));
initialize(document);
