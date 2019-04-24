import GlobalEvents from "/app/js/common/EventCaller.js";
import NESBank from "/app/js/models/NESBank.js";



var ELCtrl = null;
var ELSel = null;
var ELLab = null;
var ELOff = null;
var SURF = null;


function OpenControls(){
  if (ELCtrl !== null && SURF !== null){
    switch(SURF.access_mode){
      case NESBank.ACCESSMODE_8K:
        ELSel.value = "8K";
        ELLab.classList.add("hidden");
        break;
      case NESBank.ACCESSMODE_4K:
        ELSel.value = "4K"; break;
      case NESBank.ACCESSMODE_2K:
        ELSel.value = "2K"; break;
      case NESBank.ACCESSMODE_1K:
        ELSel.value = "1K"; break; 
        break;
      case NESBank.ACCESSMODE_1T:
        ElSel.value = "1T"; break;
    }

    if (ELSel.value !== "8K"){
      ELLab.classList.remove("hidden");
      ELOff.setAttribute("max", SURF.access_offset_length - 1);
      ELOff.value = SURF.access_offset;
      //ELOff.setAttribute("value", SURF.access_offset);
    }
    ELCtrl.classList.remove("hidden");
  }
}

function CloseControls(){
  if (ELCtrl !== null){
    ELCtrl.classList.add("hidden");
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
  if (ELCtrl !== null && SURF !== null){
    var val = this.options[this.selectedIndex].value; 
    switch(val){
      case "8K":
        SURF.access_mode = NESBank.ACCESSMODE_8K;
        ELLab.classList.add("hidden");
        break;
      case "4K":
        SURF.access_mode = NESBank.ACCESSMODE_4K; break;
      case "2K":
        SURF.access_mode = NESBank.ACCESSMODE_2K; break;
      case "1K":
        SURF.access_mode = NESBank.ACCESSMODE_1K; break;
      case "1T":
        SURF.access_mode = NESBank.ACCESSMODE_1T; break;
    }
    if (SURF.access_mode !== NESBank.ACCESSMODE_8K){
      ELLab.classList.remove("hidden");
      //ELOff.setAttribute("value", SURF.access_offset);
      ELOff.setAttribute("max", SURF.access_offset_length - 1);
      ELOff.value = SURF.access_offset;
    }
  }
}


function HANDLE_OffsetChange(){
  if (ELCtrl !== null && SURF !== null){
    var val = parseInt(this.value);
    SURF.access_offset = val;
  }
}


class CTRLBankTools{
  constructor(){
    GlobalEvents.listen("change_surface", HANDLE_SurfChange);
  }

  close(){
    if (ELSel)
      ELSel.removeEventListener("change", HANDLE_ModeChange);
    if (ELOff)
      ELOff.removeEventListener("change", HANDLE_OffsetChange);
    if (ELCtrl)
      ELCtrl.classList.add("hidden");
    ELCTRL = null;
    ELSel = null;
    ELLab = null;
    ELOff = null;
  }

  initialize(){
    if (ELCtrl === null){
      ELCtrl = document.querySelector(".painter-bank-controls");
      if (!ELCtrl){
        console.log("ERROR: Failed to find 'painter-bank-controls' element");
        return;
      }

      ELSel = ELCtrl.querySelector(".painter-bank-mode");
      if (!ELSel){
        this.close();
        console.log("ERROR: Failed to find 'painter-bank-mode' element.");
        return;
      }

      ELLab = ELCtrl.querySelector(".painter-bank-offset");
      if (!ELLab){
        this.close();
        console.log("ERROR: Failed to find 'painter-bank-offset' element.");
        return;
      }

      ELOff = ELLab.querySelector("#offset-select");
      if (!ELOff){
        this.close();
        console.log("ERROR: Failed to find 'offset-select' element.");
        return;
      }
      ELSel.addEventListener("change", HANDLE_ModeChange);
      ELOff.addEventListener("change", HANDLE_OffsetChange);
      OpenControls();
    }
  }
}


const instance = new CTRLBankTools();
export default instance;




