import GlobalEvents from "/app/js/common/EventCaller.js";
import Utils from "/app/js/common/Utils.js";
import JSONSchema from "/app/js/common/JSONSchema.js";
import NESBank from "/app/js/models/NESBank.js";
import NESPalette from "/app/js/models/NESPalette.js";
import NESNameTable from "/app/js/models/NESNameTable.js";
import CTRLPalettesStore from "/app/js/ctrls/CTRLPalettesStore.js";
import CTRLBanksStore from "/app/js/ctrls/CTRLBanksStore.js";
import CTRLNameTablesStore from "/app/js/ctrls/CTRLNameTablesStore.js";


const SUPPORTED_PROJECT_VERSIONS=[
  "0.1"
];

const PROJECT_ID="NESPProj"

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
    "bankStore":{"$ref":"http://nespaint/BanksStoreSchema.json"},
    "nametableStore":{"$ref":"http://nespaint/NametableStoreSchema.json"}
  },
  "required":["id","version","paletteStore","bankStore"]
});


var SURF = null;


function JSONFromProject(){
  var proj = {
    id:PROJECT_ID,
    version:SUPPORTED_PROJECT_VERSIONS[SUPPORTED_PROJECT_VERSIONS.length - 1],
    paletteStore:CTRLPalettesStore.obj,
    bankStore:CTRLBanksStore.obj
  };
  if (CTRLNameTablesStore.keys.length > 0)
    proj.nametableStore = CTRLNameTablesStore.obj;
  return JSON.stringify(proj);
}

function RequestDownload(filename, datblob){
  var a = document.createElement("a");
  a.href = window.URL.createObjectURL(datblob);
  a.download = filename;
  var body = document.querySelector("body");
  body.appendChild(a);
  a.click();
  setTimeout(function(){  // fixes firefox html removal bug
    window.URL.revokeObjectURL(a.href);
    a.remove();
  }, 500);
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


function HANDLE_NewProject(){
  GlobalEvents.emit("modal-close");
  CTRLNameTablesStore.clear();
  CTRLBanksStore.clear();
  CTRLPalettesStore.clear();

  CTRLPalettesStore.createPalette("Palette 1");
  CTRLBanksStore.createBank("Bank 1");
}


function HANDLE_SaveProject(e){
  //var a = document.createElement("a");
  var file = new Blob([JSONFromProject()], {type: "text/plain"});
  RequestDownload("nesproject.json", file); 
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
        if (o.id !== PROJECT_ID){
          console.log("ERROR: Project ID is invalid. Canceling project load.");
          return;
        }
        if (SUPPORTED_PROJECT_VERSIONS.indexOf(o.version) < 0){
          console.log("ERROR: Project file version does not match any supported version numbers. Canceling project load.");
          return;
        }
        // NOTE: For future... branch out to specific version loaders as needed.
        // Since only one version is currently supported, however, just continue on, my friends!
        CTRLPalettesStore.obj = o.paletteStore;
        CTRLBanksStore.obj = o.bankStore;
        if ("nametableStore" in o)
          CTRLNameTablesStore.obj = o.nametableStore;
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


function HANDLE_ExportCHR(e){
  e.preventDefault();
  var bank = CTRLBanksStore.currentBank;
  if (bank !== null){
    var dat = null;
    var size = document.querySelector('input[name="exportchr-size"]:checked').value;
    switch (size){
      case "full":
        dat = bank.getCHR(0,0);
        break;
      case "current":
        dat = bank.chr;
    }

    if (dat !== null){
      var file = new Blob([dat], {type:"application/octet-stream"});
      var filename = CTRLBanksStore.currentBankName.replace(/[^a-z0-9\-_.]/gi, '_').toLowerCase() + ".chr";
      RequestDownload(filename, file);
    }
  }
  GlobalEvents.emit("modal-close");
}

function HANDLE_ExportPalASM(e){
  var pal = CTRLPalettesStore.currentPalette;
  var palname = CTRLPalettesStore.currentPaletteName.replace(/[^a-z0-9\-_.]/gi, '_');
  if (pal !== null && palname !== ""){
    var asmtxt = pal.to_asm(palname);
    var file = new Blob([asmtxt], {type: "text/plain"});
    RequestDownload(palname + ".asm", file);
  }
}

function HANDLE_ExportNameTableASM(e){
  var nt = CTRLNameTablesStore.currentNametable;
  if (nt !== null){
    var basename = CTRLNameTablesStore.currentNTName.replace(/[^a-z0-9\-_.]/gi, '_');
    var mode = document.querySelector('input[name="exportnt-op"]:checked').value;

    var asm = "";
    switch (mode){
      case "both":
        asm = nt.to_asm(basename + "_NT", basename + "_AT");
        break;
      case "nametable":
        asm = nt.nametable_asm(basename + "_NT");
        break;
      case "attribtable":
        asm = nt.attribtable_asm(basename + "_AT");
        break;
    }

    if (asm !== ""){
      var file = new Blob([asm], {type: "text/plain"});
      RequestDownload(basename + ".asm", file);
    }
  }
}


function HANDLE_SurfChange(surf){
  var enableclass = "";
  if (surf instanceof NESBank){
    SURF = surf;
    enableclass = "surf-bank";
  } else {
    SURF = null;
    if (surf instanceof NESNameTable)
      enableclass="surf-nametable";
  }

  var e = document.querySelectorAll(".surf-export");
  for (let i=0; i < e.length; i++){
    var ea = e[i].querySelector("a");
    if (ea){
      if (e[i].classList.contains(enableclass)){
        e[i].classList.remove("disable-links");
        ea.classList.remove("pure-menu-disabled");
      } else {
        e[i].classList.add("disable-links");
        ea.classList.add("pure-menu-disabled");
      }
    }
  }
}

class CTRLIO{
  constructor(){
    GlobalEvents.listen("change_surface", HANDLE_SurfChange);
    GlobalEvents.listen("save-project", HANDLE_SaveProject);
    GlobalEvents.listen("load-project", HANDLE_LoadProjectRequest);
    GlobalEvents.listen("export-pal-asm", HANDLE_ExportPalASM);
    GlobalEvents.listen("export-nametable", HANDLE_ExportNameTableASM);
    GlobalEvents.listen("new-project", HANDLE_NewProject);

    var input = document.querySelectorAll("input.project-loader");
    if (input.length > 0){
      input[0].addEventListener("change", HANDLE_LoadProject);
    }
  }

  initialize(){
    // Connecting drag/drop ability.
    var e = document.querySelectorAll(".drop-zone");
    for (let i=0; i < e.length; e++){
      e[i].addEventListener("dragover", HANDLE_DragOver);
      e[i].addEventListener("drop", HANDLE_FileDrop);
    }

    // Connecting to button for export request.
    var e = document.querySelectorAll(".export-chr-btn");
    for (let i=0; i < e.length; i++){
      e[i].addEventListener("click", HANDLE_ExportCHR);
    }


    CTRLPalettesStore.initialize();
    CTRLBanksStore.initialize();
    CTRLNameTablesStore.initialize();
  }
}


const instance = new CTRLIO();
export default instance;



