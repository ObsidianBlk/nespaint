import GlobalEvents from "/app/js/common/EventCaller.js";
import EmitterElements from "/app/js/ui/Emitters.js";
import Input from "/app/js/ui/Input.js";
import Modal from "/app/js/ui/Modal.js";
import CTRLPalettes from "/app/js/ctrls/CTRLPalettes.js";
import CTRLPainter from "/app/js/ctrls/CTRLPainter.js";
import NESPalette from "/app/js/models/NESPalette.js";
import NESTile from "/app/js/models/NESTile.js";
import NESBank from "/app/js/models/NESBank.js";

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

function handle_keyevent(e){
  console.log(e);
}

function handle_mouseevent(e){
  console.log(e);
}

function handle_mouseclickevent(e){
  console.log("MOUSE CLICK ON BUTTON: ", e.button);
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

  //var nespainter = new NESPainter(DOC.getElementById("painter"));

  var palette = new NESPalette();
  // TODO: This is just test code. I should remove this.
  palette.listen("palettes_changed", on_palette_changed);
  // TODO: At least define a more useful set of palettes. As it is, these are just random.
  palette.set_palette([
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
  console.log(palette.to_asm());
  GlobalEvents.emit("set_app_palette", palette);

  var input = new Input();
  input.preventDefaults = true;
  input.mouseTargetElement = document.getElementById("painter");
  input.listen("keydown", handle_keyevent);
  input.listen("keyup", handle_keyevent);
  input.listen("keypress", handle_keyevent);

  input.listen("mousemove", handle_mouseevent);
  input.listen("mousedown", handle_mouseevent);
  input.listen("mouseup", handle_mouseevent);
  input.listen("mouseclick", handle_mouseclickevent);

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
}


//console.log(document.getElementByID("painter"));
initialize(document);
