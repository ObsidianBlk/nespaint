import GlobalEvents from "/app/js/common/EventCaller.js";
import NESBank from "/app/js/models/NESBank.js";



var EL = null;
var SURF = null;
var LastVal = "all";

function GetSubControls(){
  var els = [];
  if (EL !== null){
    var ellab = EL.querySelectorAll(".painter-bank-offset");
    var eloff = null;
    if (ellab.length === 1){
      els.push(ellab[0]);
      eloff = els[0].querySelectorAll("#offset-select");
      if (eloff.length === 1){
        els.push(eloff[0]);
      } else {
        console.log("Ambiguous number of 'offset-select' elements.");
      }
    } else {
      console.log("Ambiguous number of 'painter-bank-offset' elements.");
    }
  }
  return (els.length == 2) ? els : null;
}

function OpenControls(){
  if (EL !== null && SURF !== null){
    var subel = GetSubControls();
    switch(SURF.access_mode){
      case NESBank.ACCESSMODE_8K:
        subel[0].classList.add("hidden");
        break;
      case NESBank.ACCESSMODE_4K:
      case NESBank.ACCESSMODE_2K:
      case NESBank.ACCESSMODE_1K:
        subel[0].classList.remove("hidden");
        subel[1].setAttribute("max", SURF.access_offset_length - 1);
        subel[1].setAttribute("value", SURF.access_offset);
        break;
    }
    EL.classList.remove("hidden"); 
  }
}

function CloseControls(){
  if (EL !== null){
    EL.classList.add("hidden");
  }
}


function HANDLE_SurfChange(surf){
  if (surf instanceof NESBank){
    SURF = surf;
    OpenControls();
  } else {
    SURF = null;
    CloseControls();
  }
}


function HANDLE_ModeChange(){
  if (EL !== null && SURF !== null){
    var val = this.options[this.selectedIndex].value; 
    var subel = GetSubControls();
    switch(val){
      case "8K":
        SURF.access_mode = NESBank.ACCESSMODE_8K;
        subel[0].classList.add("hidden");
        break;
      case "4K":
        SURF.access_mode = NESBank.ACCESSMODE_4K;
        subel[0].classList.remove("hidden");
        subel[1].setAttribute("value", SURF.access_offset);
        subel[1].setAttribute("max", SURF.access_offset_length - 1);
        break;
      case "2K":
        SURF.access_mode = NESBank.ACCESSMODE_2K;
        subel[0].classList.remove("hidden");
        subel[1].setAttribute("value", SURF.access_offset);
        subel[1].setAttribute("max", SURF.access_offset_length - 1);
        break;
      case "1K":
        SURF.access_mode = NESBank.ACCESSMODE_1K;
        subel[0].classList.remove("hidden");
        subel[1].setAttribute("value", SURF.access_offset);
        subel[1].setAttribute("max", SURF.access_offset_length - 1);
        break;
    }
  }
}


function HANDLE_OffsetChange(){
  if (EL !== null && SURF !== null){
    var val = parseInt(this.value);
    SURF.access_offset = val;
  }
}


class CTRLBankTools{
  constructor(){
    GlobalEvents.listen("change_surface", HANDLE_SurfChange);
  }

  initialize(){
    if (EL === null){
      EL = document.querySelectorAll(".painter-bank-controls");
      if (EL.length !== 1){
        console.log("ERROR: More than one painter-bank-controls element found. Ambiguous State.");
        return;
      }
      EL = EL[0];
      var elsel = EL.querySelectorAll(".painter-bank-mode");
      if (elsel.length !== 1){
        console.log("Ambiguous number of 'painter-bank-mode' elements.");
        EL = null;
        return;
      }
      elsel = elsel[0];
      elsel.addEventListener("change", HANDLE_ModeChange);
      var subel = GetSubControls();
      subel[1].addEventListener("change", HANDLE_OffsetChange);
      OpenControls();
    }
  }
}


const instance = new CTRLBankTools();
export default instance;




