import GlobalEvents from "/app/js/EventCaller.js";
import {NESPalette} from "/app/js/NESPalette.js";

const ATTRIB_NESIDX = "nesidx";
// The two attributes below MUST BOTH be in the element.
const ATTRIB_PALIDX = "pidx";     // This is the palette index (0 - 3 (Tiles) 4 - 7 (Sprites))
const ATTRIB_COLIDX = "cidx";  // This is the color index in the selected palette (0 - 3)

const CLASS_BTN_ACTIVE = "pure-button-active";


var Active_Palette_Index = 0;
var Active_Color_Index = 0;


function InvertRGB(hex){
  var h = (255 - parseInt(hex, 16)).toString(16);
  return (h.length < 2) ? "0" + h : h;
}

function InvertColor(chex, bw){
  bw = (bw === true);
  if (chex.indexOf("#") === 0){
    chex = chex.slice(1);
  }
  if (chex.length === 3){
    chex = chex[0] + chex[0] + chex[1] + chex[1] + chex[2] + chex[2];
  }
  if (chex.length !== 6){
    throw new ValueError("Hex color expected to be 3 or 6 characters long.");
  }
  if (bw) {
    var r = parseInt(chex.slice(0, 2), 16);
    var g = parseInt(chex.slice(2, 4), 16);
    var b = parseInt(chex.slice(4, 6), 16);
    // http://stackoverflow.com/a/3943023/112731
    return (r * 0.299 + g * 0.587 + b * 0.114) > 186
      ? '#000000' : '#FFFFFF';
    }
  return "#" + InvertRGB(chex.slice(0, 2)) + InvertRGB(chex.slice(2, 4)) + InvertRGB(chex.slice(4, 6));
}

function GetPaletteIndexes(el){
  if (el.hasAttribute(ATTRIB_PALIDX) && el.hasAttribute(ATTRIB_COLIDX)){
    var pi = el.getAttribute(ATTRIB_PALIDX);
    if (!isNaN(pi))
      pi = parseInt(pi);
    else
      pi = -1;
    var ci = el.getAttribute(ATTRIB_COLIDX);
    if (!isNaN(ci))
      ci = parseInt(ci);
    else
      ci = -1;
    if (pi >= 0 && pi < 4 && ci >= 0 && ci < 4){
      return {pi:pi, ci:ci};
    }
  }
  return null;
}

function SetPaletteElStyle(el, c){
  el.style["background-color"] = c;
  el.style.color = InvertColor(c);
}

function SetColorPaletteEls(mode, pal){
  var elist = document.querySelectorAll("[" + ATTRIB_PALIDX + "]");
  elist.forEach(function(el){
    var i = GetPaletteIndexes(el);
    if (i !== null){
      SetPaletteElStyle(el, pal.get_palette_color((mode*4) + i.pi, i.ci));
    }
  });
}

function FindAndColorPalette(mode, pi, ci, pal){
  if ((mode == 0 && pi < 4) || (mode == 1 && pi >= 4)){
    var el = document.querySelector("[" + ATTRIB_PALIDX +"='" + (pi%4) + "']" +
      "[" + ATTRIB_COLIDX + "='" + ci + "']");
    if (el){
      SetPaletteElStyle(el, pal.get_palette_color(pi, ci));
    }
  }
}


class CTRLPalettes{
  constructor(){
    this.__NESPalette = null;
    this.__activePaletteEl = null;
    this.__mode = 0; // 0 = Tile palette mode | 1 = Sprite palette mode.

    var self = this;

    // ------------------------------------------------------------------------------------
    // Defining hooks for the main system palette interactions.
    // ------------------------------------------------------------------------------------
    var handle_syspalette_clicked = function(event){
      if (self.__activePaletteEl !== null && this.hasAttribute(ATTRIB_NESIDX)){
        var idx = parseInt(this.getAttribute(ATTRIB_NESIDX), 16);
        if (idx >= 0 && idx < NESPalette.SystemColor.length){
          var i = GetPaletteIndexes(self.__activePaletteEl);
          if (self.__palette !== null && i !== null){
            self.__NESPalette.set_palette_syscolor_index(i.pi, i.ci, idx);
            SetPaletteElStyle(self.__activePaletteEl, NESPalette.SystemColor[idx]);
          }
        }
      }
    };
    var elist = document.querySelectorAll("[" + ATTRIB_NESIDX + "]");
    elist.forEach(function(el){
      var idx = parseInt(el.getAttribute(ATTRIB_NESIDX), 16);
      if (idx >= 0 && idx < NESPalette.SystemColor.length){
        SetPaletteElStyle(el, NESPalette.SystemColor[idx]);
        el.addEventListener("click", handle_syspalette_clicked);
      }
    });


    // ------------------------------------------------------------------------------------
    // Defining hooks for the drawing palette interactions.
    // ------------------------------------------------------------------------------------
    var handle_palcolor_clicked = function(event){
      if (this.hasAttribute(ATTRIB_PALIDX) && this.hasAttribute(ATTRIB_COLIDX)){
        if (this !== self.__activePaletteEl){
          var i = GetPaletteIndexes(this);
          if (i !== null){
            if (self.__activePaletteEl !== null){
              self.__activePaletteEl.classList.remove(CLASS_BTN_ACTIVE);
            }
            this.classList.add(CLASS_BTN_ACTIVE);
            self.__activePaletteEl = this;
            //self.emit("active_palette_color", i);
          }
        }
      }
    };
    var elist = document.querySelectorAll("[" + ATTRIB_PALIDX + "]");
    elist.forEach(function(el){
      if (el.hasAttribute(ATTRIB_PALIDX) && el.hasAttribute(ATTRIB_COLIDX)){
        el.addEventListener("click", handle_palcolor_clicked);
      }
    });

    // ------------------------------------------------------------------------------------
    // Setting some hooks to watch for some global events.
    // ------------------------------------------------------------------------------------
    var handle_set_app_palette(p){
      if (p instanceof NESPalette){
        self.palette = p;
      }
    }
    GlobalEvents.listen("set_app_palette", handle_syspalette_changed);
  }

  get palette(){
    return this.__NESPalette;
  }

  set palette(p){
    if (!(p instanceof NESPalette)){
      throw new TypeError("Expected NESPalette object instance.");
    }
    var self = this;
    var handle_palettes_changed = function(event){
      if (self.__NESPalette !== null){
        if (event.type == "ALL"){
          SetColorPaletteEls(self.__mode, self.__NESPalette);
        } else {
          FindAndColorPalette(self.__mode, event.pindex, event.cindex, self.__NESPalette);
        }
      }
    }

    // Disconnect listener from old palette and connect it to new palette.
    if (this.__NESPalette !== p){
      if (this.__NESPalette !== null){
        this.__NESPalette.unlisten("palettes_changed", handle_palettes_changed);
      }
      this.__NESPalette = p;
      this.__NESPalette.listen("palettes_changed", handle_palettes_changed);
    }
    var elist = document.querySelectorAll("[" + ATTRIB_PALIDX + "]");
    elist.forEach((function(el){
      if (el.hasAttribute(ATTRIB_COLIDX)){
        var i = GetPaletteIndexes(el);
        if (i !== null){
          SetPaletteElStyle(el, p.get_palette_color((this.__mode * 4) + i.pi, i.ci));
        }
      }
    }).bind(this));
  }
}


const instance = new CTRLPalettes();
export default instance;



