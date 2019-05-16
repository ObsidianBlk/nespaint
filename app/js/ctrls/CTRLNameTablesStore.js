import GlobalEvents from "/app/js/common/EventCaller.js";
import Utils from "/app/js/common/Utils.js";
import JSONSchema from "/app/js/common/JSONSchema.js";
import EditableText from "/app/js/ui/EditableText.js";
import Renderer from "/app/js/ui/Renderer.js";
import NESNameTable from "/app/js/models/NESNameTable.js";
import NESPalette from "/app/js/models/NESPalette.js";
import CTRLBanksStore from "/app/js/ctrls/CTRLBanksStore.js";

const NTLI_TEMPLATE = "nametable-list-item-template";
const NTLI_CANVAS = "nametable-img";
const NTLI_TITLE = "title";
const NTLI_SELECTED = "list-item-selected";


var Nametables = {};
var CurrentNT = "";


const SCHEMA_ID="http://nespaint/NametableStoreSchema.json";
JSONSchema.add({
  "$schema": "http://json-schema.org/draft-07/schema#",
  "$id": SCHEMA_ID,
  "type": "array",
  "items":{
    "type": "object",
    "properties":{
      "name":{
        "type": "string",
        "minLength": 1
      },
      "data":{
        "type": "string",
        "media": {
          "binaryEncoding": "base64"
        }
      },
      "bank":{
        "type": "string",
        "minLength": 1
      }
    },
    "required":["name", "data"]
  }
});


function HANDLE_NTClick(e){
  var name = this.getAttribute("ntname");
  if (name !== CurrentNT){
    if (CurrentNT !== "")
      Nametables[CurrentNT].el.classList.remove(NTLI_SELECTED);
    CurrentNT = name;
    Nametables[CurrentNT].el.classList.add(NTLI_SELECTED);
    GlobalEvents.emit("change_surface", Nametables[CurrentNT].nametable);
  }
}


function SetElNTName(el, name){
  var et = new EditableText(el, "title");
  et.listen("value_change", (v) => {el.setAttribute("ntname", v);});
  et.value = name;
  return et;
}


var RenderNametableToEl = Utils.throttle(function(el, nametable){
  var cnv = el.querySelector("." + NTLI_CANVAS);
  var ctx = cnv.getContext("2d");

  Renderer.renderToFit(nametable, ctx);
}, 500); // Only update twice a second.


function HANDLE_NametableDataChange(nametable, e){
  RenderNametableToEl(this, nametable);
}

function ConnectElementToNametable(el, nametable){
  nametable.listen("data_changed", HANDLE_NametableDataChange.bind(el, nametable));
}


function CreateNametableDOMEntry(name, nametable){
  var baseel = document.querySelector("." + NTLI_TEMPLATE);
  if (!baseel){
    console.log("WARNING: Failed to find nametable list item template.");
    return null;
  }
  var el = baseel.cloneNode(true);
  el.classList.remove(NTLI_TEMPLATE);
  el.classList.remove("hidden");
  el.setAttribute("ntname", name);
  ConnectElementToNametable(el, nametable); 
  el.addEventListener("click", HANDLE_NametableClick);
  baseel.parentNode.appendChild(el);
  setTimeout(()=>{
    RenderNametableToEl(el, nametable);
  }, 500); // Make the render call in about a half second. Allow DOM time to catch up?
  return el;
}


class CTRLNametablesStore{
  constructor(){
    var HANDLE_ChangeSurface = function(surf){
      if (!(surf instanceof NESNameTable)){
        if (CurrentNT !== ""){
          Nametables[CurrentNT].el.classList.remove(NTLI_SELECTED);
          CurrentNT = "";
        }
      } else {
        if (Nametables.length <= 0 || (CurrentNT !== "" && Nametables[CurrentNT].nametable !== surf)){
          console.log("WARNING: Nametable object being set outside of Nametables Store.");
        }
      }
    }
    GlobalEvents.listen("change_surface", HANDLE_ChangeSurface);


    GlobalEvents.listen("ntstore-add", (function(ev){
      GlobalEvents.emit("modal-close");
      var e = document.querySelector(".nt-store-add");
      if (e){
        var eform = e.querySelector("form");
        var einput = e.querySelector('input[name="storeitemname"]');
        if (eform && einput){
          var name = einput.value;
          eform.reset();
          this.createNametable(name);
          this.activateNametable(name);
        } 
      }
    }).bind(this));

    GlobalEvents.listen("ntstore-remove", (function(e){
      if (CurrentNT !== "")
        this.removeNametable(CurrentNT);
    }).bind(this));
  }

  get length(){
    return Object.keys(Nametables).length;
  }

  get obj(){
    var data = [];
    Object.keys(Nametables).forEach((key) => {
      if (Nametables.hasOwnProperty(key)){
        jdata = {
          name: key,
          data: Nametables[key].nametable.base64
        };
        if (Nametables[key].nametable.bank !== null){
          var bankname = CTRLBanksStore.getBankName(Nametables[key].nametable.bank);
          if (bankname !== null)
            jdata.bank = bankname;
        }
        data.push(jdata);
      }
    });
    return data;
  }

  set obj(d){
    var validator = JSONSchema.getValidator(SCHEMA_ID);
    if (validator !== null && validator(d)){
      this.clear();
      d.forEach((item) => {
        this.createNametable(item.name, item.data);
        if ("bank" in item){
          var bnk = CTRLBanksStore.getBank(item.bank);
          if (bnk !== null && item.name in Nametables)
            Nametables[item.name].nametable.bank = bnk;
        }
      });
    } else {
      var errs = JSONSchema.getLastErrors();
      if (errs !== null){
        console.log(errs);
      }
      throw new Error("Object failed to validate against NametableStoreSchema.");
    }
  }

  get json(){ 
    return JSON.stringify(this.obj);
  }

  set json(j){
    try {
      this.obj = JSON.parse(j);
    } catch (e) {
      throw e;
    }
  }

  get currentNametable(){
    return (CurrentNT === "") ? null : Nametables[CurrentNT].nametable;
  }

  get currentNTName(){
    return CurrentNT;
  }

  get keys(){
    return Object.keys(Nametables);
  }

  initialize(){
    if (this.length <= 0){
      this.createNametable("Nametable");
    }
    return this;
  }


  createBank(name, bbase64){
    if (!(name in Nametables)){
      var nametable = new NESNameTable();
      if (typeof(bbase64) === "string"){
        try {
          nametable.base64 = bbase64; 
        } catch (e) {
          console.log("Failed to create Nametable. " + e.toString());
          nametable = null;
        }
      }
      if (nametable !== null){
        var el = CreateNametableDOMEntry(name, nametable);
        if (el){
          var elname = SetElNTName(el, name);
          Nametables[name] = {nametable:nametable, el:el, elname:elname};

          if (this.length <= 1){
            Nametables[name].el.click();
          }
        }
      }
    }
    return this;
  }


  removeBank(name){
    if (name in Nametables){
      if (name === CurrentNT){
        var keys = Object.keys(Nametables);
        if (keys.length > 1){
          CurrentNT = (keys[0] !== name) ? keys[0] : keys[1];
        } else {
          CurrentNT = "";
        }
      }
      Nametables[name].el.parentNode.removeChild(Nametables[name].el);
      delete Nametables[name];
      if (CurrentNT !== ""){
        Nametables[CurrentNT].el.click();
      } else {
        GlobalEvents.emit("change_surface", null);
      }
    }
    return this;
  }

  renameBank(name, newname){
    if ((name in Nametables) && !(newname in Nametables)){
      Nametables[newname] = Nametables[name];
      Nametables[newname].elname.value = newname;
      delete Nametables[name];
    }
    return this;
  }

  activateBank(name){
    if (CurrentNT !== name && (name in Nametables)){
      Nametables[name].el.click();
    }
    return this;
  }

  getNametableName(nametable){
    if (!(nametable instanceof NESNameTable))
      throw new TypeError("Expected NESNameTable instance.");
    var keys = Object.keys(Nametables);
    for (let i=0; i < keys.length; i++){
      if (Nametables[keys[i]].nametable.eq(nametable))
        return keys[i];
    }
    return null;
  }

  getNametable(name){
    return (name in Nametables) ? Nametables[name].nametable : null;
  }

  clear(){
    Object.keys(Nametables).forEach((item) => {
      Nametables[item].el.parentNode.removeChild(Nametables[item].el);
    });
    Nametables = {};
    if (CurrentNT !== ""){
      CurrentNT = "";
      GlobalEvents.emit("change_surface", null);
    }
  }
}


const instance = new CTRLNametablesStore();
export default instance;


