import GlobalEvents from "/app/js/common/EventCaller.js";
import NESBank from "/app/js/models/NESBank.js";



var EL = null;
var SURF = null;
var LastVal = "all";

function OpenControls(){
  if (EL !== null && SURF !== null){
    EL.classList.remove("hidden");
    var e = EL.querySelectorAll("input[type='radio']:checked");
    if (e.length > 0){
      var val = e[0].getAttribute("value");
      LastVal = val;
      if (val === "tiles"){
        SURF.access_mode = 0;
        GlobalEvents.emit("set_palette_mode", 0);
      } else if (val === "sprites"){
        SURF.access_mode = 1;
        GlobalEvents.emit("set_palette_mode", 1);
      } else {
        SURF.access_mode = 2;
      }
    }
  }
}

function CloseControls(){
  if (EL !== null){
    EL.classList.add("hidden");
  }
}


function HANDLE_ModeChanged(){
  var val = this.getAttribute("value");
  if (val !== LastVal){
    LastVal = val;
    if (val === "all"){
      SURF.access_mode = NESBank.ACCESSMODE_FULL;
    } else if (val === "sprites"){
      SURF.access_mode = NESBank.ACCESSMODE_SPRITE;
      GlobalEvents.emit("set_palette_mode", 1);
    } else if (val === "tiles"){
      SURF.access_mode = NESBank.ACCESSMODE_BACKGROUND;
      GlobalEvents.emit("set_palette_mode", 0);
    }
  }
}


class CTRLBankTools{
  constructor(){
    var handle_surfchange = function(surf){
      if (surf instanceof NESBank){
        SURF = surf;
        OpenControls();
      } else {
        SURF = null;
        CloseControls();
      }
    };
    GlobalEvents.listen("change_surface", handle_surfchange);
  }

  initialize(){
    if (EL === null){
      EL = document.querySelectorAll(".painter-bank-controls");
      if (EL.length !== 1){
        console.log("ERROR: More than one painter-bank-controls element found. Ambiguous State.");
        return;
      }
      EL = EL[0];
      var rel = EL.querySelectorAll("input[type='radio']");
      for (let i=0; i < rel.length; i++){
        rel[i].addEventListener("change", HANDLE_ModeChanged);
      }
      OpenControls();
    }
  }
}


const instance = new CTRLBankTools();
export default instance;




