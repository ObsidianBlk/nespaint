import GlobalEvents from "/app/js/common/EventCaller.js";
import EmitterElements from "/app/js/ui/Emitters.js";
import Input from "/app/js/ui/Input.js";
import Modal from "/app/js/ui/Modal.js";
import Tabs from "/app/js/ui/Tabs.js";
import CTRLPalettes from "/app/js/ctrls/CTRLPalettes.js";
import CTRLPainter from "/app/js/ctrls/CTRLPainter.js";
import CTRLPalettesStore from "/app/js/ctrls/CTRLPalettesStore.js";
import NESPalette from "/app/js/models/NESPalette.js";
import NESTile from "/app/js/models/NESTile.js";
import NESBank from "/app/js/models/NESBank.js";


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
  Tabs.initialize();
  //GlobalEvents.listen("emitted-event", handle_emitted);

  //var nespainter = new NESPainter(DOC.getElementById("painter"));
  
  CTRLPainter.initialize();
  CTRLPalettesStore.initialize();

  
  //console.log(palette.to_asm());
  //GlobalEvents.emit("set_app_palette", palette);
 
  // TODO: Drop all of this below test code... or put it in a dedicated test app.
  var TileA = new NESTile();
  var TileB = new NESTile();
  TileB.setPixelIndex(0,0,2);
  var TileC = TileB.clone().flip(1);
  var TileD = TileB.clone().flip(3);
  //var TileC = TileB.clone();
  //TileC.flip(1);

  for (var i=0; i < 64; i++){
    console.log(TileC.pixels[i]);
  }

  console.log("TileA does NOT match TileB: ", TileA.isEq(TileB) == -1);
  console.log("TileA does NOT match TileC: ", TileA.isEq(TileC) == -1);
  console.log("TileB DOES match TileC with Flag 1: ", TileB.isEq(TileC) == 1);
  console.log("TileB DOES match TileD with Flag 3: ", TileB.isEq(TileD) == 3);

  console.log(TileC);
  console.log(TileC.dataArray);
  console.log(TileC.pixels[7]);

  var bnk = new NESBank();
  bnk.lp[1] = TileB;
  bnk.lp[0] = TileC;
  bnk.rp[16] = TileD;
  console.log(bnk.chr);
  console.log("Bank color at coordinates (8,0): ", bnk.getColor(8,0));
  console.log("Bank color at coordinates (7,0): ", bnk.getColor(7,0));
  console.log("Bank color at coordinates (135, 15): ", bnk.getColor(135,15));

  bnk.access_mode = 0;
  GlobalEvents.emit("change_surface", bnk);
}


//console.log(document.getElementByID("painter"));
initialize(document);
