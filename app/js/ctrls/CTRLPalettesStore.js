import GlobalEvents from "/app/js/common/EventCaller.js";
import Utils from "/app/js/common/Utils.js";
import JSONSchema from "/app/js/common/JSONSchema.js";
import EditableText from "/app/js/ui/EditableText.js";
import NESPalette from "/app/js/models/NESPalette.js";


const PLI_TEMPLATE = "palette-list-item-template";
const PLI_TITLE = "title";
const PLI_SELECTED = "list-item-selected";

const PLI_BG_COLOR = "pal-bg-color";
const PLI_FG_BASE = "pal-fg-";
const PLI_BG_BASE = "pal-bg-";
const PLI_COLOR_BASE = "nes-color-bg-";

var Palettes = [];
var CurrentPaletteIndex = 0;

var BlockEmits = false;


JSONSchema.add({
  "$schema": "http://json-schema.org/draft-07/schema#",
  "$id": "PalettesStoreSchema.json",
  "type": "array",
  "items": {
    "type": "object",
    "properties": {
      "name":{
        "type":"string",
        "minLength":1
      },
      "palette":{
        "$ref":"NESPaletteSchema.json"
      }
    },
    "required":["name","palette"]
  }
});


function HANDLE_PaletteClick(e){
  if (!this.hasAttribute("palname")){return;}
  var pname = this.getAttribute("palname");

  if (Palettes.length > 0){
    if (Palettes[CurrentPaletteIndex][0].value !== pname || !Palettes[CurrentPaletteIndex][2].classList.contains(PLI_SELECTED)){
      var oel = Palettes[CurrentPaletteIndex][2];
      oel.classList.remove(PLI_SELECTED);

      for (let i=0; i < Palettes.length; i++){
        if (Palettes[i][0].value === pname){
          Palettes[i][2].classList.add(PLI_SELECTED);
          CurrentPaletteIndex = i;
          GlobalEvents.emit("set_app_palette", Palettes[i][1]);
          break;
        }
      }
    }
  }
}

function SetElPaletteName(el, pname){
  el.setAttribute("palname", pname);
  var et = new EditableText(el, "title");
  et.value = pname;
  et.listen("value_change", (v) => {el.setAttribute("palname", v);});
  return et;
  /*var sel = el.querySelectorAll("." + PLI_TITLE);
  if (sel.length === 1){
    sel = sel[0];
    sel.innerHTML = pname;
  }*/
}

function SetElToColor(el, mode, pi, ci, hex){
  var cel = null;
  if (ci === 0){
    cel = el.querySelectorAll("." + PLI_BG_COLOR);
  } else {
    cel = el.querySelectorAll("." + ((mode == 0) ? PLI_FG_BASE : PLI_BG_BASE) + pi + "-" + ci);
  }
  if (cel !== null && cel.length === 1){
    cel = cel[0];
    var clist = cel.getAttribute("class").split(" ");
    for (let i=0; i < clist.length; i++){
      if (clist[i].startsWith(PLI_COLOR_BASE)){
        cel.classList.remove(clist[i]);
        break;
      }
    }
    cel.classList.add(PLI_COLOR_BASE + hex.toUpperCase());
  }
}


function ColorElementToPalette(el, palette){
  SetElToColor(
    el, 0,
    0, 0,
    palette.get_palette_syscolor_index(0,0,true)
  );
  for (let p=0; p < 8; p++){
    for (let c=1; c < 4; c++){
      SetElToColor(
        el, (p >= 4) ? 0 : 1,
        p%4, c,
        palette.get_palette_syscolor_index(p,c,true)
      );
    }
  } 
}

function ConnectElementToPalette(el, palette){
  palette.listen("palettes_changed", (e) => {
    if (e.type == "ALL"){
      if (e.hasOwnProperty("cindex")){ 
        SetElToColor(
          el, 0,
          0, 0,
          palette.get_palette_syscolor_index(0,0,true)
        );
      } else {
        ColorElementToPalette(el, palette);
      }
    } else if (e.type == "SPRITE"){
      SetElToColor(
        el, 0,
        e.pindex%4, e.cindex,
        palette.get_palette_syscolor_index(e.pindex, e.cindex, true)
      );
    } else if (e.type == "TILE"){
      SetElToColor(
        el, 1,
        e.pindex, e.cindex,
        palette.get_palette_syscolor_index(e.pindex, e.cindex, true)
      );
    }
  });
}


function CreatePaletteDOMEntry(pname, palette){
  var oel = document.querySelectorAll("." + PLI_TEMPLATE);
  if (oel.length == 1){
    var el = oel[0].cloneNode(true);
    el.classList.remove(PLI_TEMPLATE);
    el.classList.remove("hidden");
    ConnectElementToPalette(el, palette);
    ColorElementToPalette(el, palette);
    //SetElPaletteName(el, pname);
    el.addEventListener("click", HANDLE_PaletteClick);
    oel[0].parentNode.appendChild(el);
    return el;
  } else {
    console.log("WARNING: Multiple templates found. Ambigous state.");
  }
  return null;
}


class CTRLPalettesStore{
  constructor(){
    GlobalEvents.listen("palstore-add", (function(e){
      if (e.hasOwnProperty("palname")){
        this.createPalette(e.palname);
        this.activatePalette(e.palname);
      }
    }).bind(this));

    GlobalEvents.listen("palstore-remove", (function(e){
      this.removePalette(Palettes[CurrentPaletteIndex][0]);
    }).bind(this));
  }

  get obj(){
    var d = [];
    for (let i=0; i < Palettes.length; i++){
      d.push({name:Palettes[i][0].value, palette:Palettes[i][1].obj});
    }
    return d;
  }


  set obj(d){
    try {
      this.json = JSON.stringify(d);
    } catch (e) {
      throw e;
    }
    /*if (d.hasOwnProperty("cpi") && d.hasOwnProperty("pals")){
      if (Utils.isInt(d.cpi) && d.pals instanceof Array){
        var newPalettes = []
        for (let i=0; i < d.pals.length; i++){
          if (d.pals[i] instanceof Array){
            if (this.getPalette(d.pals[i][0]) === null){
              this.createPalette(d.pals[i][0], d.pals[i][1]);
            }
          }
        }
        CurrentPaletteIndex = 0
        if (Palettes.length > 0){
          if (d.cpi >= 0 && d.cpi < Palettes.length){
            CurrentPaletteIndex = d.cpi;
          }
          GlobalEvents.emit("set_app_palette", Palettes[CurrentPaletteIndex][1]);
        }
      } else {
        throw new TypeError("Object Property Value types invalid.");
      }
    } else {
      throw new TypeError("Object missing expected properties.");
    }*/
  }

  get json(){
    return JSON.stringify(this.obj);
  }

  set json(j){
    var validator = null;
    try {
      validator = JSONSchema.getValidator("PalettesStoreSchema.json");
    } catch (e) {
      throw e;
    }

    if (validator(j)){
      this.clear();
      var o = JSON.parse(j);
      for (let i=0; i < o.length; i++){
        this.createPalette(o[i].name, JSON.stringify(o[i].palette));
      }
    } else {
      throw new Error("JSON Object failed verification.");
    }
  }

  initialize(){
    if (Palettes.length <= 0)
      this.createPalette("Palette");
    return this;
  }

  paletteIndexFromName(name){
    for (let i=1; i < Palettes.length; i++){
      if (Palettes[i][0].value == name){
        return i;
      }
    }
    return -1;
  }

  getPalette(name){
    var i = this.paletteIndexFromName(name);
    return (i >= 0) ? Palettes[i][1] : null;
  }

  createPalette(name, pjson){
    var palette = this.getPalette(name);
    if (palette === null){
      palette = new NESPalette();
      if (typeof(pjson) === "string"){
        try {
          palette.json = pjson;
        } catch (e) {
          console.log("Failed to create palette.", e.toString());
          palette = null;
        }
      } else {
        palette.set_palette([
          "0F",
          "05","06","07",
          "09","0A","0B",
          "01","02","03",
          "0D","00","20",
          "15","16","17",
          "19","1A","1B",
          "11","21","31",
          "1D","10","30"
        ]);
      }

      if (palette !== null){
        var el = CreatePaletteDOMEntry(name, palette);
        var eltitle = SetElPaletteName(el, name);
        Palettes.push([eltitle, palette, el]);

        if (Palettes.length <= 1 && !BlockEmits){
          el.click();        
        }
      }
    }
    return this;
  }

  removePalette(name){
    for (let i=0; i < Palettes.length; i++){
      if (Palettes[i][0].value === name){
        if (CurrentPaletteIndex === i){
          CurrentPaletteIndex = 0;
          this.activatePalette(Palettes[0][0].value);
        }
        Palettes[i][2].parentNode.removeChild(Palettes[i][2]);
        Palettes.splice(i, 1);
      }
    }

    if (Palettes.length <= 0){
      this.createPalette("Palette");
    } else {
      Palettes[CurrentPaletteIndex][2].click();
    }
    return this;
  }

  renamePalette(oldname, newname){
    var i = this.paletteIndexFromName(oldname);
    if (i < 0)
      throw new ValueError("Failed to find palette named '" + oldname +"'. Cannot rename.");
    Palettes[i][0].value = newname;
    //SetElPaletteName(Palettes[i][2], newname);
    return this;
  }

  activatePalette(name){
    var i = this.paletteIndexFromName(name);
    if (i >= 0 && CurrentPaletteIndex !== i){
      Palettes[CurrentPaletteIndex][2].click();
    }
    return this;
  }

  clear(){
    for (let i=0; i < Palettes.length; i++){
      Palettes[i][2].parentNode.removeChild(Palettes[i][2]);
    }
    CurrentPaletteIndex = 0;
  }
}


const instance = new CTRLPalettesStore();
export default instance;



