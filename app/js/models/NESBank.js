
import Utils from "/app/js/common/Utils.js";
import ISurface from "/app/js/ifaces/ISurface.js";
import NESTile from "/app/js/models/NESTile.js";
import NESPalette from "/app/js/models/NESPalette.js";


function CnvIdx(x, y, am, off){
  var res = {
    side: 0,
    tileidx: 0,
    x: 0,
    y: 0
  }

  switch(am){
  case NESBank.ACCESSMODE_8K:
    res.side = (x > 128) ? 1 : 0;
    x -= (res.side === 1) ? 128, 0;
    res.tileidx = (Math.floor(y/8) * 16) + Math.floor(x / 8);
    break;
  case NESBank.ACCESSMODE_4K:
    res.side = off;
    res.tileidx = (Math.floor(y/8) * 16) + Math.floor(x / 8);
    break;
  case NESBank.ACCESSMODE_2K:
    res.side = Math.floor(off * 0.5);
    res.tileidx = (res.side*32) + ((Math.floor(y/8) * 16) + Math.floor(x / 8));
    break;
  case NESBank.ACCESSMODE_1K:
    res.side = Math.floor(off * 0.25);
    off -= (off > 3) ? 4 : 0;
    res.tileidx = (off * 16) + ((Math.floor(y/8) * 16) + Math.floor(x / 8));
    break;
  }

  res.x = x%8;
  res.y = y%8;

  return res;
}

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

    this.__emitsEnabled = true;

    var handle_datachanged = Utils.debounce((function(side, idx){
      var sendEmit = false;
      switch(this.__AccessMode){
        case NESBank.ACCESSMODE_1K:
          if (side === Math.floor(this.__AccessOffset / 4){
            if (Math.floor(idx / 64) === Math.floor(this.__AccessOffset/4))
              sendEmit = true;
          }
          break;
        case NESBank.ACCESSMODE_2K:
          if (side === Math.floor(this.__AccessOffset / 2){
            if (Math.floor(idx / 128) === Math.floor(this.__AccessOffset/2))
              sendEmit = true;
          }
          break;
        case NESBank.ACCESSMODE_4K:
          if (side === this.__AccessOffset)
            sendEmit = true;
          break;
        case NESBank.ACCESSMODE_8K:
          sendEmit = true;
      }

      if (sendEmit && this.__emitsEnabled){
        this.emit("data_changed");
      }
    }).bind(this), 250);

    for (var i=0; i < 256; i++){
      this.__LP.push(new NESTile());
      this.__LP[i].listen("data_changed", handle_datachanged.bind(this, 0, i));
      this.__RP.push(new NESTile());
      this.__RP[i].listen("data_changed", handle_datachanged.bind(this, 1, i));
    }

    this.__palette = null;
  }

  get access_mode(){return this.__AccessMode;}
  set access_mode(m){
    if (!Utils.isInt(m))
      throw new TypeError("Access mode expected to be integer.");
    switch(m){
      case NESBank.ACCESSMODE_8K:
        this.__AccessMode = NESBank.ACCESSMODE_8K;
        this.__AccessOffset = 0; 
        break;
      case NESBank.ACCESSMODE_4K:
        if (this.__AccessOffset > 1){
          switch(this.__AccessMode){
          case NESBank.ACCESSMODE_2K:
            this.__AccessOffset = Math.floor(this.__AccessOffset * 0.5);
            break;
          case NESBank.ACCESSMODE_1K:
            this.__AccessOffset = Math.floor(this.__AccessOffset * 0.25);
            break;
          }
        }
        this.__AccessMode = NESBank.ACCESSMODE_4K
        break;
      case NESBank.ACCESSMODE_2K:
        switch(this.__AccessMode){
        case NESBank.ACCESSMODE_8K:
          this.__AccessOffset = 0;
          break;
        case NESBank.ACCESSMODE_4K:
          this.__AccessOffset *= 2;
          break;
        case NESBank.ACCESSMODE_1K:
          this.__AccessOffset = Math.floor(this.__AccessOffset * 0.5);
          break;
        }
        this.__AccessMode = NESBank.ACCESSMODE_2K;
        break;
      case NESBank.ACCESSMODE_1K:
        switch(this.__AccessMode){
        case NESBank.ACCESSMODE_8K:
          this.__AccessOffset = 0;
          break;
        case NESBank.ACCESSMODE_4K:
          this.__AccessOffset *= 4;
          break;
        case NESBank.ACCESSMODE_2K:
          this.__AccessOffset *= 2;
          break;
        }
        this.__AccessMode = NESBank.ACCESSMODE_1K;
        break;

      default:
        throw new ValueError("Unknown Access Mode.");
    }

    if (this.__emitsEnabled)
      this.emit("data_changed");
  }

  get access_offset(){return this.__AccessOffset;}
  set access_offset(o){
    if (!Utils.isInt(m))
      throw new TypeError("Access offset expected to be integer.");
    switch (this.__AccessMode){
      case NESBank.ACCESSMODE_8K:
        if (o !== 0)
          throw new RangeError("Access Offset is out of bounds based on current Access Mode.");
        break;
      case NESBank.ACCESSMODE_4K:
        if (o !== 0 && o !== 1)
          throw new RangeError("Access Offset is out of bounds based on current Access Mode.");
        break;
      case NESBank.ACCESSMODE_2K:
        if (o < 0 || o >= 4)
          throw new RangeError("Access Offset is out of bounds based on current Access Mode.");
        break;
      case NESBank.ACCESSMODE_1K:
        if (o < 0 || o >= 8)
          throw new RangeError("Access Offset is out of bounds based on current Access Mode.");
        break;
    }

    this.__AccessOffset = m;
    if (this.__emitsEnabled)
      this.emit("data_changed");
  }

  get json(){
    JSON.stringify({
      LP: this.__LP.map(x=>x.base64),
      RP: this.__RP.map(x=>x.base64)
    });
  }

  get chr(){
    var buff = null;
    var offset = 0;
    switch (this.__AccessMode){
      case NESBank.ACCESSMODE_8K:
        buff = new Uint8Array(8192);
        this.__LP.forEach((i) => {
          buff.set(i.chr, offset);
          offset += 16;
        });
        this.__RP.forEach((i) => {
          buff.set(i.chr, offset);
          offset += 16;
        });
        break;

      case NESBank.ACCESSMODE_4K:
        buff = new Uint8Array(4096);
        var list = (this.__AccessOffset === 0) ? this.__LP : this.__RP;
        list.forEach((i) => {
          buff.set(i.chr, offset);
          offset += 16;
        });
        break;

      case NESBank.ACCESSMODE_2K:
        buff = new Uint8Array(2048);
        var list = (this.__AccessOffset < 2) ? this.__LP : this.__RP;
        var s = Math.floor(this.__AccessOffset * 0.5) * 128;
        var e = s + 128;
        for (let i=s; i < e; i++){
          buff.set(list[i].chr, offset);
          offset += 16;
        }
        break;

      case NESBank.ACCESSMODE_1K:
        buff = new Uint8Array(1024);
        var list = (this.__AccessOffset < 4) ? this.__LP : this.__RP;
        var s = Math.floor(this.__AccessOffset * 0.25) * 64;
        var e = s + 64;
        for (let i=s; i < e; i++){
          buff.set(list[i].chr, offset);
          offset += 16;
        }
        break;
    } 
    return buff;
  }

  /*set chr(buff){
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
  }*/

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

  get width(){return (this.__AccessMode == NESBank.ACCESSMODE_8K) ? 256 : 128;}
  get height(){
    switch(this.__AccessMode){
      case NESBank.ACCESSMODE_2K:
        return 64;
      case NESBank.ACCESSMODE_1K:
        return 32;
    }
    return 128;
  }
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

        var x = Math.floor(prop % this.width);
        var y = Math.floor(prop / this.width);
        var res = CnvIdx(x, y, this.__AccessMode, this.__AccessOffset);
        var list = (res.side === 0) ? obj.__LP : obj.__RP;
        return list[res.tileidx].getPixelIndex(res.x, res.y);
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
       
        var x = Math.floor(prop % this.width);
        var y = Math.floor(prop / this.width);
        var res = CnvIdx(x, y, this.__AccessMode, this.__AccessOffset);
        var list = (res.side === 0) ? obj.__LP : obj.__RP;
        list[res.tileidx].setPixelIndex(res.x, res.y, value);
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


  getCHR(mode, offset){
    this.__emitsEnabled = false;
    var oam = this.access_mode;
    var oao = this.access_offset;

    try{
      this.access_mode = mode;
      this.access_offset = offset;
    } catch (e){
      this.access_mode = oam;
      this.access_offset = oao;
      this.__emitsEnabled = true;
      throw e;
    }

    var chr = this.chr;
    this.access_mode = oam;
    this.access_offset = oao;
    this.__emitsEnabled = true;

    return chr;
  }

  setCHR(buff, offset){
    if (!Utils.isInt(offset) || offset < 0)
      offset = 0;

    var idx = 0;
    switch(buff.length){
      case 8192:
        this.__LP.forEach((i) => {
          i.chr = buff.slice(idx, idx+15);
          idx += 16;
        });
        this.__RP.forEach((i) => {
          i.chr = buff.slice(idx, idx+15);
          idx += 16;
        });
        break;
      case 4096:
        if (offset >= 2)
          throw new RangeError("Offset mismatch based on Buffer length.");
        var list = (offset === 0) ? this.__LP : this.__RP;
        list.forEach((i) => {
          i.chr = buff.slice(idx, idx+15);
          idx += 16;
        });
        break;
      case 2048:
        if (offset >= 4)
          throw new RangeError("Offset mismatch based on Buffer length.");
        var list = (offset < 2) ? this.__LP : this.__RP;
        var s = Math.floor(offset * 0.5) * 128;
        var e = s + 128;
        for (let i=s; i < e; i++){
          list[i].chr = buff.slice(idx, idx+15);
          idx += 16;
        }
        break;
      case 1024:
        if (offset >= 8)
          throw new RangeError("Offset mismatch based on Buffer length.");
        var list = (offset < 4) ? this.__LP : this.__RP;
        var s = Math.floor(this.__AccessOffset * 0.25) * 64;
        var e = s + 64;
        for (let i=s; i < e; i++){
          list[i].chr = buff.slice(idx, idx+15);
          idx += 16;
        }
        break;
      default:
        throw new RangeError("Buffer length does not match any of the supported bank sizes.");
    }

    return this;
  }

  getColor(x,y){
    if (x < 0 || x >= this.width || y < 0 || y >= this.height)
      return this.__default_pi[4]; 

    var res = CnvIdx(x, y, this.__AccessMode, this.__AccessOffset);
    var list = (res.side === 0) ? this.__LP : this.__RP;
    var pi = list[res.tileidx].paletteIndex + ((res.side === 0) ? 4 : 0);
    var ci = list[res.tileidx].getPixelIndex(res.x, res.y);

    if (this.__palette !== null){
      return this.__palette.get_palette_color(pi, ci);
    }
    return NESPalette.Default[ci];
  }

  getColorIndex(x, y){
    if (x < 0 || x >= this.width || y < 0 || y >= this.height)
      return {pi: -1, ci:-1};

    var res = CnvIdx(x, y, this.__AccessMode, this.__AccessOffset);
    var list = (res.side === 0) ? this.__LP : this.__RP; 
    return {
      pi: list[res.tileidx].paletteIndex,
      ci: list[res.tileidx].getPixelIndex(res.x, res.y)
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

      var res = CnvIdx(x, y, this.__AccessMode, this.__AccessOffset);
      var list = (res.side === 0) ? this.__LP : this.__RP;

      list[res.tileidx].paletteIndex = pi;
      list[res.tileidx].setPixelIndex(res.x, res.y, ci);
    }
    return this;
  }
}



NESBank.ACCESSMODE_8K = 0;
NESBank.ACCESSMODE_1K = 1;
NESBank.ACCESSMODE_2K = 2;
NESBank.ACCESSMODE_4K = 3;
