import Utils from "/app/js/common/Utils.js";
import {EventCaller} from "/app/js/common/EventCaller.js";
import NESPalette from "/app/js/models/NESPalette.js";


function BitMask(offset, inv){
  switch(offset){
    case 0:
      return parseInt((inv === true) ? '01111111' : '10000000', 2);
    case 1:
      return parseInt((inv === true) ? '10111111' : '01000000', 2);
    case 2:
      return parseInt((inv === true) ? '11011111' : '00100000', 2);
    case 3:
      return parseInt((inv === true) ? '11101111' : '00010000', 2);
    case 4:
      return parseInt((inv === true) ? '11110111' : '00001000', 2);
    case 5:
      return parseInt((inv === true) ? '11111011' : '00000100', 2);
    case 6:
      return parseInt((inv === true) ? '11111101' : '00000010', 2);
  }
  return parseInt((inv === true) ? '11111110' : '00000001', 2);
}


var BLOCK_CHANGE_EMIT = false; // This will block the "data_changed" event when class is processing
                               // lots of changes.


export default class NESTile extends EventCaller{
  constructor(){
    super();
    this.__paletteIndex = 0;
    this.__data = new Uint8Array(16);

    this.__pixels = new Proxy(this, {
      get: function(obj, prop){
        if (prop === "length")
          return 64;
        if (!Utils.isInt(prop))
          throw new TypeError("Expected integer index.");
        if (prop < 0 || prop >= 64)
          throw new RangeError("Index out of bounds.");
        var dindex = Math.floor(prop*0.125);
        var bitoffset = 7 - (prop%8);
        var v = (obj.__data[dindex] & (1 << bitoffset)) >> bitoffset;
        v += 2*((obj.__data[8+dindex] & (1 << bitoffset)) >> bitoffset);
        return v;
      },


      set: function(obj, prop, value){
        if (!Utils.isInt(prop))
          throw new TypeError("Expected integer index.");
        prop = parseInt(prop);
        if (!Utils.isInt(value))
          throw new TypeError("Color index expected to be integer.");
        if (prop < 0 || prop >= 64)
          throw new RangeError("Index out of bounds.");
        if (value < 0 || value >= 4)
          throw new RangeError("Color index out of bounds.");
        var dindex = Math.floor(prop*0.125);
        var bitoffset = (prop % 8);
        if (value == 1 || value == 3){
          obj.__data[dindex] |= BitMask(bitoffset);
        } else {
          obj.__data[dindex] &= BitMask(bitoffset, true);
        }
        if (value == 2 || value == 3){
          obj.__data[8+dindex] |= BitMask(bitoffset);
        } else {
          obj.__data[8+dindex] &= BitMask(bitoffset, true);
        }
        if (!BLOCK_CHANGE_EMIT)
          obj.emit("data_changed");
        return true;
      }
    });
  }

  get width(){return 8;}
  get height(){return 8;}

  get pixels(){
    return this.__pixels;
  }

  get dataArray(){
    var d = [];
    for (var y = 0; y < 8; y++){
      for (var x = 0; x < 8; x++){
        d.push(this.getPixelIndex(x, y));
      }
    }
    return d;
  }

  get chr(){
    return new Uint8Array(this.__data);
  }

  set chr(buff){
    if (!(buff instanceof Uint8Array))
      throw new TypeError("Expected Uint8Array buffer");
    if (buff.length !== 16)
      throw new RangeError("Buffer contains invalid byte length.");
    this.__data = new Uint8Array(buff);
    this.emit("data_changed");
  }

  get base64(){
    var b = ""
    for (var i = 0; i < this.__data.length; i++) {
      b += String.fromCharCode(this.__data[i]);
    }
    b += String.fromCharCode(this.__paletteIndex);
    return window.btoa(b);
  }
  set base64(s){
    var b =  window.atob(s);
    var len = b.length;
    if (b.length !== 17){
      throw new Error("Base64 string contains invalid byte count.");
    }
    var bytes = new Uint8Array(b.length-1);
    for (var i=0; i < b.length-1; i++){
      bytes[i] = b.charCodeAt(i);
    }
    this.__data = bytes;
    this.__paletteIndex = b.charCodeAt(b.length-1);
    this.emit("data_changed");
  }


  get paletteIndex(){return this.__paletteIndex;}
  set paletteIndex(pi){
    if (!Utils.isInt(pi))
      throw new TypeError("Palette index expected to be an integer.");
    if (pi < 0 || pi >= 4){
      throw new RangeError("Palette index out of bounds.");
    }
    this.__paletteIndex = pi;
    this.emit("data_changed");
  }

  setPixelIndex(x, y, ci){
    if (x < 0 || x >= 8 || y < 0 || y >= 8){
      throw new ValueError("Coordinates out of bounds.");
    }
    if (ci < 0 || ci >= 4){
      throw new ValueError("Color index out of bounds.");
    }
    this.__pixels[(y*8)+x] = ci;
    return this;
  }

  getPixelIndex(x, y){
    if (x < 0 || x >= 8 || y < 0 || y >= 8){
      throw new ValueError("Coordinates out of bounds.");
    }
    return this.__pixels[(8*y) + x];
  }

  flip(flag){
    if (flag >= 1 && flag <= 3){
      var oldData = this.__data;
      var newData = new Uint8Array(16);
      BLOCK_CHANGE_EMIT = true;
      for (var x = 0; x < 8; x++){
        for (var y = 0; y < 8; y++){
          this.__data = oldData;
          var ci = this.getPixelIndex(x, y);
          this.__data = newData;
          this.setPixelIndex(
              (flag == 1 || flag == 3) ? 7 - x : x,
              (flag == 2 || flag == 3) ? 7 - y : y,
              ci
          );
        }
      }
      BLOCK_CHANGE_EMIT = false;
      this.emit("data_changed");
    }
    return this;
  }


  clone(){
    return (new NESTile()).copy(this);
  }

  copy(t){
    if (!(t instanceof NESTile))
      throw new TypeError("Expected NESTile object.");
    this.__data.set(t.__data);
    this.emit("data_changed");
    return this;
  }

  clear(){
    this.__data = new Uint8Array(16);
    this.emit("data_changed");
    return this;
  }

  isEmpty(){
    for (let i=0; i < this.__data.length; i++){
      if (this.__data[i] !== 0)
        return false;
    }
    return true;
  }

  isEq(tile, sameOrientation){
    if (!(tile instanceof NESTile)){
      throw new TypeError("Expected NESTile instance.");
    }
    sameOrientation = (sameOrientation === true);
    var b64 = this.base64;
    if (tile.base64 === b64){
      return 0;
    }
    if (!sameOrientation){
      var tc = tile.clone().flip(1); // Flip horizontal.
      if (tc.base64 === b64){
        return 1;
      }

      tc.flip(3); // Flip horizontal AND verticle. Net effect is the same as tile.clone().flip(2) ... Flip Verticle
      if (tc.base64 === b64){
        return 2;
      }

      tc.flip(1); // Flip horizontal again. Net effect is the same as tile.clone().flip(3) ... flip H & V
      if (tc.base64 === b64){
        return 3;
      }
    }
    return -1;
  }
}



