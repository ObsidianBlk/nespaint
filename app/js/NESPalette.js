

export class NESPalette { 
  constructor(){
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

  set_palette(idx, p=8){
    if (typeof(p) != 'number')
      throw new TypeError("First argument expected to be a number.");
    if (!(idx instanceof Array))
      throw new TypeError("Expected an array of color index values.");
    if (p < 0 || p >= 8){ // Setting ALL palettes!
      if (idx.length != 25)
        throw new RangeError("Color array must contain 25 color values to fill all palettes.");
      this.__BGColor = idx[0];
      for (var i=0; i < 24; i++){
        this.__palette[i] = idx[i+1]
      }
    } else { // Setting a specific palette.
      if (idx.length != 3)
        throw new RangeError("Color array must contain three color values.");
      p *= 3;
      for (var i=0; i < 4; i++){
        if (typeof(idx[i]) === 'number'){
          this.__palette[p+i] = idx[i];
        }
      }
    }
  }

  get_palette_syscolor_index(p, idx){
    if (typeof(p) != 'number' || typeof(idx) != 'number')
      throw new TypeError("Palette and color index expected to be numbers.");
    if (p < 0 || p >= 8){
      throw new RangeError("Palette index is out of bounds.");
    }
    if (idx < 0 || idx >= 4){
      throw new RangeError("Palette color index is out of bounds.");
    }
    return (idx === 0) ? this.__BGColor : this.__palette[(p*3)+(idx-1)];
  }

  get_palette_color(p, idx){
    if (typeof(p) != 'number' || typeof(idx) != 'number')
      throw new TypeError("Palette and color index expected to be numbers.");
    if (p < 0 || p >= 8){
      throw new RangeError("Palette index is out of bounds.");
    }
    if (idx < 0 || idx >= 4){
      throw new RangeError("Palette color index is out of bounds.");
    }
    return NESPalette.SystemColor(this.get_palette_syscolor_index(p, idx));
  }

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
