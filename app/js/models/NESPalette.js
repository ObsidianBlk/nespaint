import {EventCaller} from "/app/js/common/EventCaller.js"

/**
 * Object for manipulating the eight NES palettes.
 * @extends EventCaller
 */
export default class NESPalette extends EventCaller{ 
  constructor(){
    super();
    this.__BGColor = 63; // Index to the background color ALL palettes MUST share.
    this.__palette = [
      // Tile/Background Palettes
      0,0,0,
      0,0,0,
      0,0,0,
      0,0,0,
      // Sprite Palettes
      0,0,0,
      0,0,0,
      0,0,0,
      0,0,0
    ];
  }

  /**
   *  Sets one or all of the eight color palettes to the values given. By default, function
   *  assumes the given array is for all eight palettes (or 25 total color indexes, 3 per palette
   *  and 1 background/transparency color used by ALL palettes).
   *  If a single palette is being set, the array must only contain 3 entries.
   *  @param {Array} apci - Array of color indexes to store into the palette(s)
   *  @param {number} [p=8] - Zero-based index of the palette being set. Any value outside the range of 0 - 7 will set ALL palettes.
   *  @returns {this}
   */
  set_palette(apci, p=8){
    var StoreColorValue = (i, v) => {
      if (typeof(v) == 'number'){
        if (i >= 0)
          this.__palette[i] = v
        else
          this.__BGColor = v;
      } else if (typeof(v) == 'string' && v.length == 2){
        var c = parseInt(v, 16);
        if (!isNaN(c)){
          if (i >= 0)
            this.__palette[i] = c;
          else
            this.__BGColor = c;
        }
      }
    };

    if (typeof(p) != 'number')
      throw new TypeError("First argument expected to be a number.");
    if (!(apci instanceof Array))
      throw new TypeError("Expected an array of color index values.");
    if (p < 0 || p >= 8){ // Setting ALL palettes!
      if (apci.length != 25)
        throw new RangeError("Color array must contain 25 color values to fill all palettes.");
      StoreColorValue(-1, apci[0]);
      for (var i=0; i < 24; i++){
        StoreColorValue(i, apci[i+1]); 
      }
    } else { // Setting a specific palette.
      if (apci.length != 3)
        throw new RangeError("Color array must contain three color values.");
      p *= 3;
      for (var i=0; i < 4; i++){
        StoreColorValue(p+i, apci[i]);
      }
    }
    this.emit("palettes_changed", {type:"ALL"});
    return this;
  }

  /**
   *  Sets a palette's color index value to a given system color index.
   *  NOTE: Setting palette color index 0 for ANY palette changes that index for ALL palettes.
   *  @param {number} p - The index of the palette being set.
   *  @param {number} pci - The palette color index (0 - 3) to set.
   *  @param {number} sci - The system color index (0 - 63) value to set to.
   *  @returns {this}
   */
  set_palette_syscolor_index(p, pci, sci){
    if (typeof(p) != 'number' || typeof(pci) != 'number' || typeof(sci) != 'number')
      throw new TypeError("Palette, palette color, and system color index expected to be numbers.");
    if (p < 0 || p >= 8){
      throw new RangeError("Palette index is out of bounds.");
    }
    if (pci < 0 || pci >= 4){
      throw new RangeError("Palette color index is out of bounds.");
    }
    if (typeof(sci) == "string" && sci.length == 2)
      sci = parseInt(sci, 16);
    if (isNaN(sci))
      throw new TypeError("System Color Index expected to be a number of hex value string.");
    if (sci < 0 || sci >= 64){
      throw new RangeError("System color index is out of bounds.");
    }
    if (pci == 0){
      this.__BGColor = sci;
      this.emit("palettes_changed", {type:"ALL", cindex:0}); 
    } else { 
      this.__palette[(p*3) + (pci-1)] = sci;
      this.emit("palettes_changed", {type:(p < 4) ? "TILE" : "SPRITE", pindex:p, cindex:pci});
    }
    return this;
  }

  /**
   *  Returns the system color index at the given palette color index.
   *  @param {number} p - The index (0 - 7) of the palette.
   *  @param {number} pci - The palette color index (0 - 3).
   *  @param {boolean} [ashex=false] - If true, will return the index as a two character hex string. 
   *  @returns {number} - The index of the system color used.
   */
  get_palette_syscolor_index(p, pci, ashex=false){
    if (typeof(p) != 'number' || typeof(pci) != 'number')
      throw new TypeError("Palette and color index expected to be numbers.");
    if (p < 0 || p >= 8){
      throw new RangeError("Palette index is out of bounds.");
    }
    if (pci < 0 || pci >= 4){
      throw new RangeError("Palette color index is out of bounds.");
    }
    var i = (pci === 0) ? this.__BGColor : this.__palette[(p*3)+(pci-1)];
    if (ashex){
      i = i.toString(16);
      i = ((i.length < 2) ? "0" : "") + i;
    }
    return i;
  }

  /**
   *  Returns a hex string color value used by the NES system at the index stored at the given
   *  palette color index.
   *  @param {number} p - The index (0 - 7) of the palette.
   *  @param {number} pci - The palette color index (0 - 3).
   *  @returns {string}
   */
  get_palette_color(p, pci){
    if (typeof(p) != 'number' || typeof(pci) != 'number')
      throw new TypeError("Palette and color index expected to be numbers.");
    if (p < 0 || p >= 8){
      throw new RangeError("Palette index is out of bounds.");
    }
    if (pci < 0 || pci >= 4){
      throw new RangeError("Palette color index is out of bounds.");
    }
    return NESPalette.SystemColor[this.get_palette_syscolor_index(p, pci)];
  }

  /**
   *  Generates a small 6502 assembly block string containing the current palette data.
   *  @param {string} [memname="PaletteData"] The label named under which to store the data.
   *  @returns {string}
   */
  to_asm(memname="PaletteData"){
    var NumToHex=function(n){
      var h = n.toString(16);
      if (h.length %2)
        h = '0' + h;
      return '$' + h;
    };
    var BGHex = NumToHex(this.__BGColor);
    var s = memname + ":\n\t.db ";

    // Storing background palette data.
    for (var i=0; i < 12; i++){
      if (i % 3 == 0)
        s += ((i == 0) ? "" : " ") + BGHex;
      s += " " + NumToHex(this.__palette[i]);
    }
    s += "\t; Background palette data.\n\t.db ";

    // Storing foreground palette data.
    for (var i=12; i < 24; i++){
      if (i % 3 == 0)
        s += ((i == 12) ? "" : " ") + BGHex;
      s += " " + NumToHex(this.__palette[i]);
    }
    s += "\t; Foreground palette data.";

    return s;
  }
}


// NES Palette color information comes from the following site...
// http://www.thealmightyguru.com/Games/Hacking/Wiki/index.php/NES_Palette 
/**
 *  Hex string color values representing the NES system palette.
 */
NESPalette.SystemColor = [
  "#7C7C7C",
  "#0000FC",
  "#0000BC",
  "#4428BC",
  "#940084",
  "#A80020",
  "#A81000",
  "#881400",
  "#503000",
  "#007800",
  "#006800",
  "#005800",
  "#004058",
  "#000000",
  "#000000",
  "#000000",
  "#BCBCBC",
  "#0078F8",
  "#0058F8",
  "#6844FC",
  "#D800CC",
  "#E40058",
  "#F83800",
  "#E45C10",
  "#AC7C00",
  "#00B800",
  "#00A800",
  "#00A844",
  "#008888",
  "#000000",
  "#000000",
  "#000000",
  "#F8F8F8",
  "#3CBCFC",
  "#6888FC",
  "#9878F8",
  "#F878F8",
  "#F85898",
  "#F87858",
  "#FCA044",
  "#F8B800",
  "#B8F818",
  "#58D854",
  "#58F898",
  "#00E8D8",
  "#787878",
  "#000000",
  "#000000",
  "#FCFCFC",
  "#A4E4FC",
  "#B8B8F8",
  "#D8B8F8",
  "#F8B8F8",
  "#F8A4C0",
  "#F0D0B0",
  "#FCE0A8",
  "#F8D878",
  "#D8F878",
  "#B8F8B8",
  "#B8F8D8",
  "#00FCFC",
  "#F8D8F8",
  "#000000",
  "#000000"
];

NESPalette.Default = [
  "#080808",
  "#343434",
  "#a2a2a2",
  "#efefef",
  "#666666" // Out of bounds color.
];


