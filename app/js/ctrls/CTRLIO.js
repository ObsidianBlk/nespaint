import GlobalEvents from "/app/js/common/EventCaller.js";
import Utils from "/app/js/common/Utils.js";
import NESBank from "/app/js/models/NESBank.js";
import NESPalette from "/app/js/models/NESPalette.js";



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
    console.log(files[i]);
  }
}

class CTRLIO{
  constructor(){}

  initialize(){
    var e = document.querySelectorAll(".drop-zone");
    for (let i=0; i < e.length; e++){
      e[i].addEventListener("dragover", HANDLE_DragOver);
      e[i].addEventListener("drop", HANDLE_FileDrop);
    }
  }
}


const instance = new CTRLIO();
export default instance;



