import GlobalEvents from "/app/js/EventCaller.js";
//import EventWindow from "/app/js/ui/EventWindow.js";
import EmitterElements from "/app/js/ui/Emitters.js";
import Modal from "/app/js/ui/Modal.js";
import CTRLPalettes from "/app/js/ui/CTRLPalettes.js";
import {NESPainter} from "/app/js/NESPainter.js";
import {NESPalette} from "/app/js/NESPalette.js";

function on_palette_changed(e){
  if (e.type == "ALL"){
    console.log("ALL");
  } else if (e.type == "TILE"){
    console.log("TILE Palette:", e.pindex, " | Color:", e.cindex);
  } else if (e.type == "SPRITE"){
    console.log("SPRITE Palette:", e.pindex, " | Color:", e.cindex);
  }
}

function handle_emitted(){
  console.log("EMITTED EVENT!");
}

function TitlePainter(pal){
  var elist = document.querySelectorAll(".color-NES-random");
  if (elist){
    elist.forEach(function(el){
      var ca = Math.floor(Math.random() * 11) + 1;
      var cb = Math.floor(Math.random() * 3);
      var index = (cb*16)+ca;
      el.style.color = pal[index];
      el.style["background-color"] = "#000";
    });
  }
}

function initialize(DOC){
  TitlePainter(NESPalette.SystemColor);
  EmitterElements.initialize();
  //EventWindow.enable_emitter_attributes();
  GlobalEvents.listen("emitted-event", handle_emitted);

  var nespainter = new NESPainter(DOC.getElementById("painter"));

  console.log(nespainter.scale);
  nespainter.scale_up(5);
  console.log(nespainter.scale);

  CTRLPalettes.palette = new NESPalette();
  CTRLPalettes.palette.listen("palettes_changed", on_palette_changed);
  CTRLPalettes.palette.set_palette([
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
  console.log(CTRLPalettes.palette.to_asm());
}


//console.log(document.getElementByID("painter"));
initialize(document);
