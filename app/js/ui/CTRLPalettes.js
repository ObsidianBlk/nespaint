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


class CTRLPalettes{
  constructor(){
    this.__NESPalette = null;
    this.__pi = 0; // Palette index.
    this.__ci = 0; // Palette color index.
    this.__mode = 0; // 0 = Tile palette mode | 1 = Sprite palette mode.

    var self = this;

    var handle_syspalette_clicked = function(event){
      if (this.hasAttribute(ATTRIB_NESIDX)){
        var idx = parseInt(this.getAttribute(ATTRIB_NESIDX), 16);
        if (idx >= 0 && idx < NESPalette.SystemColor.length){
          console.log(idx);
          // TODO: Set a selected Tile/Sprite palette index to the color index clicked.
        }
      }
    };
    var elist = document.querySelectorAll("[" + ATTRIB_NESIDX + "]");
    elist.forEach(function(el){
      var idx = parseInt(el.getAttribute(ATTRIB_NESIDX), 16);
      if (idx >= 0 && idx < NESPalette.SystemColor.length){
        el.style["background-color"] = NESPalette.SystemColor[idx];
        el.style.color = InvertColor(NESPalette.SystemColor[idx], true);
        el.addEventListener("click", handle_syspalette_clicked);
      }
    });


    var handle_palcolor_clicked = function(event){
      if (this.hasAttribute(ATTRIB_PALIDX) && this.hasAttribute(ATTRIB_COLIDX)){
        var i = GetPaletteIndexes(this);
        if (i !== null){
          if (self.__pi !== i.pi || self.__ci !== i.ci){
            // TODO: Instead of storing __pi and __ci, hold the active element.
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
  }

  get palette(){
    return this.__NESPalette;
  }

  set palette(p){
    if (!(p instanceof NESPalette)){
      throw new TypeError("Expected NESPalette object instance.");
    }
    this.__NESPalette = p;
    var elist = document.querySelectorAll("[" + ATTRIB_PALIDX + "]");
    elist.forEach((function(el){
      if (el.hasAttribute(ATTRIB_COLIDX)){
        var i = GetPaletteIndexes(el);
        if (i !== null){
          var c = p.get_palette_color((this.__mode * 4) + i.pi, i.ci);
          el.style["background-color"] = c;
          el.style.color = InvertColor(c, true);
        }
      }
    }).bind(this));
  }
}


const instance = new CTRLPalettes();
export default instance;



