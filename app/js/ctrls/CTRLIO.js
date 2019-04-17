import GlobalEvents from "/app/js/common/EventCaller.js";
import Utils from "/app/js/common/Utils.js";
import JSONSchema from "/app/js/common/JSONSchema.js";
import NESBank from "/app/js/models/NESBank.js";
import NESPalette from "/app/js/models/NESPalette.js";
import CTRLPalettesStore from "/app/js/ctrls/CTRLPalettesStore.js";
import CTRLBanksStore from "/app/js/ctrls/CTRLBanksStore.js";



const SUPPORTED_PROJECT_VERSIONS=[
  "0.1"
];

const SCHEMA_ID = "http://nespaint/Project.json";
JSONSchema.add({
  "$schema": "http://json-schema.org/draft-07/schema#",
  "$id": SCHEMA_ID,
  "type":"object",
  "properties":{
    "id":{
      "type":"string",
      "enum":["NESPProj"]
    },
    "version":{
      "type":"string",
      "pattern":"^[0-9]{1,}\.[0-9]{1,}$"
    },
    "paletteStore":{"$ref":"http://nespaint/PalettesStoreSchema.json"},
    "bankStore":{"$ref":"http://nespaint/BanksStoreSchema.json"}
  },
  "required":["id","version","paletteStore","bankStore"]
});


var SURF = null;


function JSONFromProject(){
  var proj = {
    id:"NESPProj",
    version:SUPPORTED_PROJECT_VERSIONS[SUPPORTED_PROJECT_VERSIONS.length - 1],
    paletteStore:CTRLPalettesStore.obj,
    bankStore:CTRLBanksStore.obj
  };
  return JSON.stringify(proj);
}

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


function HANDLE_SaveProject(e){
  var a = document.createElement("a");
  var file = new Blob([JSONFromProject()], {type: "text/plain"});
  a.href = window.URL.createObjectURL(file);
  a.download = "nesproject.json";
  var body = document.querySelector("body");
  body.appendChild(a);
  a.click();
  setTimeout(function(){  // fixes firefox html removal bug
    window.URL.revokeObjectURL(url);
    a.remove();
  }, 500); 
}

function HANDLE_LoadProjectRequest(){
  var input = document.querySelectorAll("input.project-loader");
  if (input.length > 0){
    input[0].click();
  }
}

function HANDLE_LoadProject(e){
  if (this.files && this.files.length > 0){
    var reader = new FileReader();
    reader.onload = (function(e) {
      var o = null;
      var validator = JSONSchema.getValidator(SCHEMA_ID);
      try {
        o = JSON.parse(e.target.result);
      } catch (e) {
        console.log("Failed to parse JSON string. " + e.toString());
      }
      if (validator !== null && validator(o)){
        // TODO: Validate 'id' and 'version' properties.
        CTRLPalettesStore.obj = o.paletteStore;
        CTRLBanksStore.obj = o.bankStore;
      }
      if (this.parentNode.nodeName.toLowerCase() === "form"){
        this.parentNode.reset();
      } else {
        console.log("WARNING: Parent node is NOT a <form> element.");
      }
    }).bind(this);
    reader.readAsText(this.files[0]);
  } else {
    console.log("Project file not found or no file selected.");
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
    GlobalEvents.listen("save-project", HANDLE_SaveProject);
    GlobalEvents.listen("load-project", HANDLE_LoadProjectRequest);

    var input = document.querySelectorAll("input.project-loader");
    if (input.length > 0){
      input[0].addEventListener("change", HANDLE_LoadProject);
    }
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



