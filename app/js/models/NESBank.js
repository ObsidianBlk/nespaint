
import Utils from "/app/js/common/Utils.js";
import ISurface from "/app/js/ifaces/ISurface.js";
import NESTile from "/app/js/models/NESTile.js";
import NESPalette from "/app/js/models/NESPalette.js";


function LRIdx2TileIdxCo(index){
  var res = {
    lid: 0,
    index: 0,
    x: 0,
    y: 0
  };
  var x = Math.floor(index % 256);
  var y = Math.floor(index / 256);
  if (x < 128){
    res.index = (Math.floor(y/8) * 16) + Math.floor(x / 8);
  } else {
    res.index = (Math.floor(y/8) * 16) + Math.floor((x - 128) / 8);
    res.lid = 1;
  }
  res.x = x % 8;
  res.y = y % 8;
  return res;
}

export default class NESBank extends ISurface{
  constructor(){
    super();
    this.__LP = []; // Left Patterns (Sprites)
    this.__RP = []; // Right Patterns (Backgrounds) 

    for (var i=0; i < 256; i++){
      this.__LP.push(new NESTile());
      this.__RP.push(new NESTile());
    }

    this.__palette = null;
  }

  get json(){
    JSON.stringify({
      LP: this.__LP.map(x=>x.base64),
      RP: this.__RP.map(x=>x.base64)
    });
  }

  get chr(){
    var buff = new Uint8Array(8192);
    var offset = 0;
    this.__LP.forEach(function(i){
      buff.set(i.chr, offset);
      offset += 16;
    });
    this.__RP.forEach(function(i){
      buff.set(i.chr, offset);
      offset += 16;
    });
    return buff;
  }

  get palette(){return this.__palette;}
  set palette(p){
    if (p !== null && !(p instanceof NESPalette))
      throw new TypeError("Expected null or NESPalette object.");
    if (p !== this.__palette){
      this.__palette = p;
    }
  }

  get width(){return 256;}
  get height(){return 128;}
  get length(){return this.width * this.height;}

  get coloridx(){
    return new Proxy(this, {
      get:function(obj, prop){
        var len = (obj.__LP.length * 8) + (obj.__RP.length * 8);
        if (prop === "length")
          return len;
        if (!Utils.isInt(prop))
          throw new TypeError("Expected integer index.");
        prop = parseInt(prop);
        if (prop < 0 || prop >= len)
          return this.__default_pi[4];
        
        var res = LRIdx2TileIdxCo(prop);
        var list = (res.lid === 0) ? obj.__LP : obj.__RP; 
        return list[res.index].getPixelIndex(res.x, res.y);
      },

      set:function(obj, prop, value){
        if (!Utils.isInt(prop))
          throw new TypeError("Expected integer index.");
        if (!Utils.isInt(value))
          throw new TypeError("Color expected to be integer.");
        prop = parseInt(prop);
        value = parseInt(value);
        if (prop < 0 || prop >= len)
          throw new RangeError("Index out of bounds.");
        if (value < 0 || value >= 4)
          throw new RangeError("Color index out of bounds.");
        
        var res = LRIdx2TileIdxCo(prop);
        var list = (res.lid === 0) ? obj.__LP : obj.__RP;
        list[res.index].setPixelIndex(res.x, res.y, value);
        return true;
      }
    });
  }

  get lp(){
    return new Proxy(this, {
      get: function(obj, prop){
        if (prop === "length")
          return obj.__LP.length;
        if (!Utils.isInt(prop))
          throw new TypeError("Expected integer index.");
        prop = parseInt(prop);
        if (prop < 0 || prop >= 256)
          throw new RangeError("Index out of bounds.");
        return obj.__LP[prop];
      },

      set: function(obj, prop, value){
        if (!Utils.isInt(prop))
          throw new TypeError("Expected integer index.");
        if (!(value instanceof NESTile))
          throw new TypeError("Can only assign NESTile objects.");
        prop = parseInt(prop);
        if (prop < 0 || prop >= 256)
          throw new RangeError("Index out of bounds.");
        obj.__LP[prop].copy(value);
        return true;
      }
    });
  }

  get rp(){
    return new Proxy(this, {
      get: function(obj, prop){
        if (prop === "length")
          return obj.__RP.length;
        if (!Utils.isInt(prop))
          throw new TypeError("Expected integer index.");
        prop = parseInt(prop);
        if (prop < 0 || prop >= 256)
          throw new RangeError("Index out of bounds.");
        return obj.__RP[prop];
      },

      set: function(obj, prop, value){
        if (!Utils.isInt(prop))
          throw new TypeError("Expected integer index.");
        if (!(value instanceof NESTile))
          throw new TypeError("Can only assign NESTile objects.");
        prop = parseInt(prop);
        if (prop < 0 || prop >= 256)
          throw new RangeError("Index out of bounds.");
        obj.__RP[prop].copy(value);
        return true;
      }
    });
  }

  copy(b){
    if (!(b instanceof NESBank))
      throw new TypeError("Expected NESBank object.");
    for (var i=0; i < 256; i++){
      this.lp[i] = b.lp[i];
      this.rp[i] = b.rp[i];
    }
    return this;
  }

  clone(){
    return (new NESBank()).copy(this);
  }

  getColor(x,y){
    if (x < 0 || x >= 256 || y < 0 || y >= 128)
      return this.__default_pi[4]; 

    var res = LRIdx2TileIdxCo((y*256)+x);
    var list = (res.lid === 0) ? this.__LP : this.__RP;
    var pi = list[res.index].paletteIndex;
    var ci = list[res.index].getPixelIndex(res.x, res.y);

    if (this.__palette !== null){
      return this.__palette.get_palette_color(pi, ci);
    }
    return this.__default_pi[ci];
  }

  getColorIndex(x, y){
    if (x < 0 || x >= 256 || y < 0 || y >= 128)
      return {pi: -1, ci:this.__default_pi[4]};

    var res = LRIdx2TileIdxCo((y*256)+x);
    var list = (res.lid === 0) ? this.__LP : this.__RP; 
    return {
      pi: list[res.index].paletteIndex,
      ci: list[res.index].getPixelIndex(res.x, res.y);
    };
  }

  setColorIndex(x, y, ci, pi){
    if (x < 0 || x >= 256 || y < 0 || y > 128)
      throw new RangeError("Coordinates out of bounds.");
    if (!Utils.isInt(pi))
      pi = -1;
    if (!Utils.isInt(ci))
      ci = 0;

    if (pi < 0){
      this.coloridx[(y*256)+x] = ci;
    } else {

      var res = LRIdx2TileIdxCo((y*256)+x);
      var list = (res.lid === 0) ? this.__LP : this.__RP;

      list[res.index].paletteIndex = pi;
      list[res.index].setPixelIndex(res.x, res.y, ci);
    }
    return this;
  }
}




