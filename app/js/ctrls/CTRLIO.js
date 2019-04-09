import GlobalEvents from "/app/js/common/EventCaller.js";
import Utils from "/app/js/common/Utils.js";
import NESBank from "/app/js/models/NESBank.js";
import NESPalette from "/app/js/models/NESPalette.js";
import CTRLPalettesStore from "/app/js/ctrls/CTRLPalettesStore.js";
import CTRLBanksStore from "/app/js/ctrls/CTRLBanksStore.js";


var SURF = null;

function LoadFile(file){
  if (SURF !== null){
    var reader = new FileReader();
    if (SURF instanceof NESBank){
      reader.onload = function(e){
        try {
          SURF.chr = new Uint8Array(e.target.result);
        } catch (e) {
          console.log(e.toString());
        }
      }
      reader.readAsArrayBuffer(file);
    }
  }
}


function HANDLE_DragOver(e){
  e.stopPropagation();
  e.preventDefault();
  e.dataTransfer.dropEffect = 'copy';
};

function HANDLE_FileDrop(e){
  e.stopPropagation();
  e.preventDefault();
  var files = e.dataTransfer.files;

  for (let i=0; i < files.length; i++){
    LoadFile(files[i]);
  }
}

function HANDLE_SurfChange(surf){
  if (surf instanceof NESBank){
    SURF = surf;
  } else {
    SURF = null;
  }
}

class CTRLIO{
  constructor(){
    GlobalEvents.listen("change_surface", HANDLE_SurfChange);
  }

  initialize(){
    var e = document.querySelectorAll(".drop-zone");
    for (let i=0; i < e.length; e++){
      e[i].addEventListener("dragover", HANDLE_DragOver);
      e[i].addEventListener("drop", HANDLE_FileDrop);
    }
    CTRLPalettesStore.initialize();
    CTRLBanksStore.initialize();
  }
}


const instance = new CTRLIO();
export default instance;



