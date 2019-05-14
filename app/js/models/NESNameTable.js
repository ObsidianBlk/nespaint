import Utils from "/app/js/common/Utils.js";
import ISurface from "/app/js/ifaces/ISurface.js";
import NESBank from "/app/js/models/NESBank.js";
import NESPalette from "/app/js/models/NESPalette.js";


export default class NESNameTable extends ISurface{
  constructor(){
    super();
    this.__bank = null;
    this.__palette = null;
    this.__tiles = [];
    this.__attribs = [];

    for (let i=0; i < 960; i++)
      this.__tiles[i] = 0;
    for (let i=0; i < 64; i++)
      this.__attribs[i] = [0,0,0,0];
  }


  get bank(){return this.__bank;}
  set bank(b){
    if (b !== null and !(b instanceof NESBank))
      throw new TypeError("Expected a NESBank object.");
    this.__bank = b;
  }

  get palette(){return this.__palette;}
  set palette(p){
    if (p !== null && !(p instanceof NESPalette))
      throw new TypeError("Expected a NESPalette object.");
    this.__palette = p;
  }

  get width(){return 256;}
  get height(){return 240;}
  get length(){return 0;}
  get undos(){return 0;}
  get redos(){return 0;}


  copy(b){
    this.bank = b.bank;
    this.palette = b.palette;
    for (let i=0; i < 960; i++)
      this.__tiles[i] = b.__tiles[i];
    for (let i=0; i < 64; i++){
      this.__attribs[i] = [
        b.__attribs[i][0],
        b.__attribs[i][1],
        b.__attribs[i][2],
        b.__attribs[i][3]
      ];
    }
    return this;
  }

  clone(){
    return (new NESNameTable()).clone(this);
  }

  snapshot(){return this;}
  undo(){return this;}
  redo(){return this;}
  clearUndos(){return this;}
  clearRedos(){return this;}
  clearHistory(){
    return this.clearUndos().clearRedos();
  }

  getColor(x, y){
    var pal = {pi:-1, ci:-1};
    try {
      pal = this.getColorIndex(x, y);
    } catch (e) {throw e;}

    if (this.__palette !== null && pal.pi >= 0 && pal.ci >= 0) {
      return this.__palette.get_palette_color(pal.pi, pal.ci);
    } else if (pal.ci >= 0){
      return NESPalette.Default(pal.ci);
    }
    return NESPalette.Default(4);
  }


  getColorIndex(x, y){
    if (x < 0 || x >= this.width || y < 0 || y >= this.height)
      throw new RangeError("Coordinates are out of bounds.");

    var pi = -1;
    var ci = -1;
    if (this.__bank !== null){
      var _x = Math.floor(x % 8);
      var _y = Math.floor(y % 8);

      var tileX = Math.floor(x / 32);
      var tileY = Math.floor(y / 32);
      var tileIndex = 256 + this.__tiles[(tileY * 32) + tileX];

      ci = this.__bank.rp[tileIndex].getPixelIndex(_x, _y);
      pi = this._PaletteFromCoords(x, y);
    }
    return {pi:pi, ci:ci};
  }


  setColorIndex(x, y, ci, pi){
    return this;
  }


  _PaletteFromCoords(x,y){
    var blockX = Math.floor(x / 32);
    var blockY = Math.floor(y / 32);
    var bIndex = (blockY * 8) + blockX;

    var palX = Math.floor(x % 16);
    var palY = Math.floor(y % 16);
    var pIndex = ((palX < 8) ? 0 : 1) + ((palY >= 8) ? 2 : 0);

    return this.__attribs[bIndex][pIndex];
  }
}



