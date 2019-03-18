
import Utils from "/app/js/common/Utils.js";
import ISurface from "/app/js/ifaces/ISurface.js";
import NESTile from "/app/js/models/NESTile.js";
import NESPalette from "/app/js/models/NESPalette.js";


function LRIdx2TileIdxCo(index, lid){
  if (isNaN(lid) || lid < 0 || lid > 2){
    lid = 2;
  }
  var res = {
    lid: 0,
    index: 0,
    x: 0,
    y: 0
  };
  var w = (lid == 2) ? 256 : 128;
  var x = Math.floor(index % w);
  var y = Math.floor(index / w);
  if (x < 128){
    res.index = (Math.floor(y/8) * 16) + Math.floor(x / 8);
    if (lid !== 2)
      res.lid = lid;
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
    this.__View = []; 
    this.__AccessMode = NESBank.ACCESSMODE_8K;
    this.__AccessOffset = 0;

    var handle_datachanged = Utils.debounce((function(side){
      if ((side == 0 && (this.__AccessMode == 0 || this.__AccessMode == 2)) ||
        (side == 1 && (this.__AccessMode == 1 || this.__AccessMode == 2))){
        this.emit("data_changed");
      }
    }).bind(this), 250);

    for (var i=0; i < 256; i++){
      this.__LP.push(new NESTile());
      this.__LP[i].listen("data_changed", handle_datachanged.bind(this, 0));
      this.__RP.push(new NESTile());
      this.__RP[i].listen("data_changed", handle_datachanged.bind(this, 1));
    }

    this.__palette = null;
  }

  get access_mode(){return this.__AccessMode;}
  set access_mode(m){
    if (!Utils.isInt(m))
      throw new TypeError("Access mode expected to be integer.");
    switch(m){
      case NESBank.ACCESSMODE_SPRITE:
        this.__AccessMode = NESBank.ACCESSMODE_SPRITE;
        this.emit("data_changed");
        break;
      case NESBank.ACCESSMODE_BACKGROUND:
        this.__AccessMode = NESBank.ACCESSMODE_BACKGROUND;
        this.emit("data_changed");
        break;
      case NESBank.ACCESSMODE_FULL:
        this.__AccessMode = NESBank.ACCESSMODE_FULL;
        this.emit("data_changed");
        break;
    }
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

  set chr(buff){
    if (!(buff instanceof Uint8Array))
      throw new TypeError("Expected Uint8Array buffer.");
    if (buff.length !== 8192)
      throw new RangeError("Data buffer has invalid byte length.");
    var offset = 0;
    this.__LP.forEach((i) => {
      i.chr = buff.slice(offset, offset+15);
      offset += 16;
    });
    this.__RP.forEach((i) => {
      i.chr = buff.slice(offset, offset+15);
      offset += 16;
    });
  }

  get base64(){
    var b = "";
    var data = this.chr;
    for (var i = 0; i < data.length; i++) {
      b += String.fromCharCode(data[i]);
    }
    return window.btoa(b);
  }

  set base64(s){
    var b =  window.atob(s);
    var len = b.length;
    if (b.length !== 8192){
      throw new Error("Base64 string contains invalid byte count.");
    }
    this.chr = b; 
  }

  get palette(){return this.__palette;}
  set palette(p){
    if (p !== null && !(p instanceof NESPalette))
      throw new TypeError("Expected null or NESPalette object.");
    if (p !== this.__palette){
      this.__palette = p;
    }
  }

  get width(){return (this.__AccessMode == NESBank.ACCESSMODE_FULL) ? 256 : 128;}
  get height(){return 128;}
  get length(){return this.width * this.height;}

  get coloridx(){
    return new Proxy(this, {
      get:function(obj, prop){
        var len = obj.length * 8;
        if (prop === "length")
          return len;
        if (!Utils.isInt(prop))
          throw new TypeError("Expected integer index.");
        prop = parseInt(prop);
        if (prop < 0 || prop >= len)
          return NESPalette.Default[4];
        
        var res = LRIdx2TileIdxCo(prop, this.__AccessMode);
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
        
        var res = LRIdx2TileIdxCo(prop, this.__AccessMode);
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
    if (x < 0 || x >= this.width || y < 0 || y >= this.height)
      return this.__default_pi[4]; 

    var res = LRIdx2TileIdxCo((y*this.width)+x, this.__AccessMode);
    var list = (res.lid === 0) ? this.__LP : this.__RP;
    var pi = list[res.index].paletteIndex + ((res.lid === 0) ? 4 : 0);
    var ci = list[res.index].getPixelIndex(res.x, res.y);

    if (this.__palette !== null){
      return this.__palette.get_palette_color(pi, ci);
    }
    return NESPalette.Default[ci];
  }

  getColorIndex(x, y){
    if (x < 0 || x >= this.width || y < 0 || y >= this.height)
      return {pi: -1, ci:-1};

    var res = LRIdx2TileIdxCo((y*this.width)+x, this.__AccessMode);
    var list = (res.lid === 0) ? this.__LP : this.__RP; 
    return {
      pi: list[res.index].paletteIndex,
      ci: list[res.index].getPixelIndex(res.x, res.y)
    };
  }

  setColorIndex(x, y, ci, pi){
    if (x < 0 || x >= this.width || y < 0 || y > this.height)
      throw new RangeError("Coordinates out of bounds.");
    if (!Utils.isInt(pi))
      pi = -1;
    if (!Utils.isInt(ci))
      ci = 0;

    if (pi < 0){
      this.coloridx[(y*this.width)+x] = ci;
    } else {

      var res = LRIdx2TileIdxCo((y*this.width)+x, this.__AccessMode);
      var list = (res.lid === 0) ? this.__LP : this.__RP;

      list[res.index].paletteIndex = pi;
      list[res.index].setPixelIndex(res.x, res.y, ci);
    }
    return this;
  }
}



NESBank.ACCESSMODE_8K = 0;
NESBank.ACCESSMODE_1K = 1;
NESBank.ACCESSMODE_2K = 2;
NESBank.ACCESSMODE_4K = 3;
