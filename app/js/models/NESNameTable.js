import Utils from "/app/js/common/Utils.js";
import ISurface from "/app/js/ifaces/ISurface.js";
import NESBank from "/app/js/models/NESBank.js";
import NESPalette from "/app/js/models/NESPalette.js";


function NumToHex(n){
  var h = n.toString(16);
  if (h.length %2)
    h = '0' + h;
  return '$' + h;
}

function CompileAttribs(attrib){
  return (attrib[3] << 6) | (attrib[2] << 4) | (attrib[1] << 2) | (attrib[0] << 0)
}

function DecompileAttribs(v){
  return [
    v & 0x00000011,
    (v & 0x00001100) >> 2,
    (v & 0x00110000) >> 4,
    (v & 0x11000000) >> 6
  ];
}

export default class NESNameTable extends ISurface{
  constructor(){
    super();
    this.__bank = null;
    this.__palette = null;
    this.__tiles = [];
    this.__attribs = [];

    this.__undos = [];
    this.__redos = [];

    for (let i=0; i < 960; i++)
      this.__tiles[i] = 0;
    for (let i=0; i < 64; i++)
      this.__attribs[i] = [0,0,0,0];
  }

  get base64(){
    var b = "";
    for (let i = 0; i < this.__tiles.length; i++)
      b += String.fromCharCode(this.__tiles[i]);
    for (let i = 0; i < this.__attribs.length; i++)
      b += String.fromCharCode(CompileAttribs(this.__attribs[i]));
    return window.btoa(b);
  }

  set base64(s){
    var b =  window.atob(s);
    var len = b.length;
    if (b.length !== 1024){
      throw new Error("Base64 string contains invalid byte count.");
    }
    b = new Uint8Array(b.split("").map(function(c){
      return c.charCodeAt(0);
    }));
    for (let i=0; i < b.length; i++){
      if (i < 960){
        this.__tiles[i] = b[i];
      } else {
        this.__attribs[i-960] = DecompileAttribs(b[i]);
      }
    }
    this.emit("data_changed");
  }

  get bank(){return this.__bank;}
  set bank(b){
    if (b !== null and !(b instanceof NESBank))
      throw new TypeError("Expected a NESBank object.");
    this.__bank = b;
    this.emit("data_changed");
  }

  get palette(){return this.__palette;}
  set palette(p){
    if (p !== null && !(p instanceof NESPalette))
      throw new TypeError("Expected a NESPalette object.");
    this.__palette = p;
    this.emit("data_changed");
  }

  get width(){return 256;}
  get height(){return 240;}
  get length(){return this.width * this.height;}
  get undos(){return this.__undos.length;}
  get redos(){return this.__redos.length;}


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
    this.emit("data_changed");
    return this;
  }

  clone(){
    return (new NESNameTable()).clone(this);
  }

  snapshot(){
    if (this.__redos.length > 0) // Remove the redo history. We're adding a new snapshot.
      this.__redos = [];

    var snap = this.base64;
    if (this.__undos.length === this.__historyLength){
      this.__undos.pop();
    }
    this.__undos.splice(0,0,snap);
    return this;
  }
  
  undo(){
    if (this.__undos.length > 0){
      var usnap = this.__undos.splice(0, 1)[0];
      var rsnap = this.base64;
      this.base64 = usnap;
      if (this.__redos.length === this.__historyLength){
        this.__redos.pop();
      }
      this.__redos.splice(0,0,rsnap); 
    }
    return this;
  }

  redo(){
    if (this.__redos.length > 0){
      var rsnap = this.__redos.splice(0,1)[0];
      var usnap = this.base64;
      this.base64 = rsnap;
      if (this.__undos.length === this.__historyLength){
        this.__undos.pop();
      }
      this.__undos.splice(0,0,usnap);
    }
    return this;
  }

  clearUndos(){
    this.__undos = [];
    return this;
  }

  clearRedos(){
    this.__redos = [];
    return this;
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

      ci = this.__bank.rp[this.__tiles[(tileY * 32) + tileX]].getPixelIndex(_x, _y);
      pi = this._PaletteFromCoords(x, y);
    }
    return {pi:pi, ci:ci};
  }


  setColorIndex(x, y, ci, pi){
    if (x < 0 || x >= this.width || y < 0 || y >= this.height)
      throw new RangeError("Coordinates are out of bounds.");
    if (pi < 0 || pi >= 4)
      throw new RangeError("Palette index is out of bounds.");

    // NOTE: This method (setColorIndex) is called by CTRLPainter, which doesn't know about painting tile
    // indicies... therefore, CTRLPainter will still call this method for NESNameTable surfaces, but all it
    // will do is change palette indicies.
    // To paint the actual tile index, however, we'll use this emit that will be watched by the CTRLNameTable class
    // and call this class's setTileIndex() method for tile painting.
    // YAY to cheating!!
    this.emit("paint_nametable");

    // Then business as usual!
    var bp = this._GetAttribBlockPalette(x,y);
    if (this.__attribs[bp.bindex][bp.pindex] !== pi){
      this.__attribs[bp.bindex][bp.pindex] = pi;
      this.emit("data_changed");
    }
    return this;
  }

  setTileIndex(x, y, ti){
    if (ti < 0 || ti >= 256)
      throw new RangeError("Tile index is out of bounds.");
    if (x < 0 || x >= this.width || y < 0 || y >= this.height)
      throw new RangeError("Coordinates are out of bounds.");

    var _x = Math.floor(x / 8);
    var _y = Math.floor(y / 8);
    var tindex = (_y * 32) + _x;
    if (this.__tiles[tindex] !== ti){
      this.__tiles[tindex] = ti;
      this.emit("data_changed");
    }
  }


  eq(nt){
    return (nt instanceof NESNameTable) ? (this.base64 === nt.base64) : false;
  }


  /**
   *  Generates a small 6502 assembly block string containing the current nametable data.
   *  @param {string} [ntname="NameTableData"] The label name under which to store the data.
   *  @returns {string}
   */
  nametable_asm(ntname="NameTableData"){
    var s = ntname + ":";

    for (let i=0; i < this.__tiles.length; i++){
      if (i % 32 === 0)
        s += "\n\t.db";
      s += " " + NumToHex(this.__tiles[i]);
    }

    return s;
  }


  /**
   *  Generates a small 6502 assembly block string containing the current attribute table data.
   *  @param {string} [atname="AttribTableData"] The label name under which to store the data.
   *  @returns {string}
   */
  attribtable_asm(atname="AttribTableData"){ 
    var s = atname + ":";

    for (let i=0; i < this.__attribs.length; i++){
      if (i % 32 === 0)
        s += "\n\t.db";
      s += " " + NumToHex(CompileAttribs(this.__attribs[i]));
    }

    return s;
  }


  /**
   *  Generates a small 6502 assembly block string containing the current name and attribute table data.
   *  @param {string} [ntname="NameTableData"] The label name under which to store the Nametable data.
   *  @param {string} [atname="AttribTableData"] the label name under which to store the Attribute table data.
   *  @returns {string}
   */
  to_asm(ntname="NameTableData", atname="AttribTableData"){ 
    return this.nametable_asm(ntname) + "\n\n" + this.attribtable_asm(atname);
  }

  _GetAttribBlockPalette(x,y){
    var bp = {bindex:0, pindex:0};

    var blockX = Math.floor(x / 32);
    var blockY = Math.floor(y / 32);
    bp.bindex = (blockY * 8) + blockX;

    var palX = Math.floor(x % 16);
    var palY = Math.floor(y % 16);
    bp.pindex = ((palX < 8) ? 0 : 1) + ((palY >= 8) ? 2 : 0);

    return bp;
  }

  _PaletteFromCoords(x,y){
    var bp = this._GetAttribBlockPalette(x,y);
    return this.__attribs[bp.bindex][bp.pindex];
  }
}





