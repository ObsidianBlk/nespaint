import GlobalEvents from "/app/js/EventCaller.js";
import {NESPalette} from "/app/js/NESPalette.js";

const ATTRIB_NESIDX = "nesidx";
// The two attributes below MUST BOTH be in the element.
const ATTRIB_PALIDX = "palidx";     // This is the palette index (0 - 3 (Tiles) 4 - 7 (Sprites))
const ATTRIB_COLIDX = "palcolidx";  // This is the color index in the selected palette (0 - 3)



var Active_Palette_Index = 0;
var Active_Color_Index = 0;



class CTRLPalettes{
  constructor(){
    this.__NESPalette = null;
    this.__pi = 0; // Palette index.
    this.__ci = 0; // Palette color index.

    var self = this;

    var handle_syspalette_clicked = function(event){
      if (this.hasAttribute(ATTRIB_NESIDX)){
        var idx = parseInt(this.getAttribute(ATTRIB_NESIDX), 16);
        if (idx >= 0 && idx < NESPalette.SystemColors.length){
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
        el.addEventListener("click", handle_syspalette_clicked);
      }
    });


    var handle_palcolor_clicked = function(event){
      if (this.hasAttribute(ATTRIB_PALIDX) && this.hasAttribute(ATTRIB_COLIDX)){
        self.__pi = this.getAttribute(ATTRIB_PALIDX);
        self.__ci = this.getAttribute(ATTRIB_COLIDX);
        console.log("Requesting Palette: " + self.__pi + " | Color: " + self.__ci);
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
  }
}


const instance = new CTRLPalettes();
export default instance;



