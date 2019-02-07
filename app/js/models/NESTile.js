import Utils from "/app/js/common/Utils.js";
import NESPalette from "/app/js/models/NESPalette.js";

function BitMask(offset){
  switch(offset){
    case 0:
      return 63;  // Mask '00111111'
    case 1:
      return 207; // Mask '11001111'
    case 2:
      return 243; // Mask '11110011'
  }
  return 252; // Mask '11111100'
}

function SetDataArrayColor(arr, x, y, ci){
  var index = (y*8)+x;
  var dindex = Math.floor(index*0.25);
  var bitoffset = (index % 4);
  arr[dindex] = (arr[dindex] & BitMask(bitoffset)) ^ (ci << ((3 - bitoffset)*2));
  //if (dindex === 1){
  //  console.log("index: ", dindex, " | value: ", arr[dindex], " | (x,y): (", x, ",", y, ") | Bit Offset: ", bitoffset, "Color: ", ci);
  //}
}


function GetDataArrayColor(arr, x, y){
  var index = (y*8)+x;
  var dindex = Math.floor(index*0.25);
  var bitoffset = 6 - ((index % 4) * 2);
  return (arr[dindex] & (3 << bitoffset)) >> bitoffset;

}


export default class NESTile{
  constructor(){
    this.__palette = null;
    this.__paletteIndex = 0;
    this.__data = new Uint8Array(16);
  }

  get pixels(){
    return new Proxy(this, {
      get: function(obj, prop){
        if (!Utils.isInt(prop))
          throw new TypeError("Expected integer index.");
        if (prop < 0 || prop >= 64)
          throw new RangeError("Index out of bounds.");
        var dindex = Math.floor(prop*0.25);
        var bitoffset = 6 - ((prop % 4) * 2);
        return (obj.__data[dindex] & (3 << bitoffset)) >> bitoffset;
      },

      set: function(obj, prop, value){
        if (!Utils.isInt(prop))
          throw new TypeError("Expected integer index.");
        if (!Utils.isInt(value))
          throw new TypeError("Color index expected to be integer.");
        if (prop < 0 || prop >= 64)
          throw new RangeError("Index out of bounds.");
        if (value < 0 || value >= 4)
          throw new RangeError("Color index out of bounds.");
        var dindex = Math.floor(index*0.25);
        var bitoffset = (index % 4);
        obj.__data[dindex] = (obj.__data[dindex] & BitMask(bitoffset)) ^ (ci << ((3 - bitoffset)*2));
      }
    });
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

  get base64(){
    var b = ""
    for (var i = 0; i < this.__data.length; i++) {
      b += String.fromCharCode(this.__data[i]);
    }
    return window.btoa(b);
  }
  set base64(s){
    var b =  window.atob(s);
    var len = b.length;
    if (b.length !== 16){
      throw new Error("Base64 string contains invalid byte count.");
    }
    var bytes = new Uint8Array(b.length);
    for (var i=0; i < b.length; i++){
      bytes[i] = b.charCodeAt(i);
    }
    this.__data = bytes;
  }

  get palette(){return this.__palette;}
  set palette(p){
    if (p !== null && !(p instanceof NESPalette)){
      throw new TypeError("Expected NESPalette instance or null.");
    }
    this.__palette = p;
  }

  get paletteIndex(){return this.__paletteIndex;}
  set paletteIndex(pi){
    if (!Utils.isInt(pi))
      throw new TypeError("Palette index expected to be an integer.");
    if (pi < 0 || pi >= 4){
      throw new RangeError("Palette index out of bounds.");
    }
    this.__paletteIndex = pi;
  }

  setPixelIndex(x, y, ci){
    if (x < 0 || x >= 8 || y < 0 || y >= 8){
      throw new ValueError("Coordinates out of bounds.");
    }
    if (ci < 0 || ci >= 4){
      throw new ValueError("Color index out of bounds.");
    }
    SetDataArrayColor(this.__data, x, y, ci);
    return this;
  }

  getPixelIndex(x, y){
    if (x < 0 || x >= 8 || y < 0 || y >= 8){
      throw new ValueError("Coordinates out of bounds.");
    }
    return GetDataArrayColor(this.__data, x, y);
  }

  getPixel(x, y){
    var ci = 0;
    try {
      ci = this.getPixelIndex(x, y);
    } catch (e) {
      throw e;
    }
    if (this.__palette !== null){
      return this.__palette.get_palette_color(this.__paletteIndex, ci);
    }
    switch(ci){
      case 1:
        return "#555555";
      case 2:
        return "#AAAAAA";
      case 3:
        return "#FFFFFF";
    }
    return 0;
  }

  flip(flag){
    if (flag >= 1 && flag <= 3){
      var newData = new Uint8Array(16);
      for (var x = 0; x < 8; x++){
        for (var y = 0; y < 8; y++){
          var ci = GetDataArrayColor(this.__data, x, y);
          SetDataArrayColor(
              newData,
              (flag == 1 || flag == 3) ? 7 - x: x,
              (flag == 2 || flag == 3) ? 7 - y: y,
              ci
          );
          //console.log(newData);
          //newData[r[0]] = 2;
          //newData[r[0]] = r[1];
        }
      }
      //console.log(newData);
      this.__data = newData;
    }
    return this;
  }


  clone(){
    var t = new NESTile();
    t.base64 = this.base64;
    return t;
  }

  isEq(tile){
    if (!(tile instanceof NESTile)){
      throw new TypeError("Expected NESTile instance.");
    }
    var b64 = this.base64;
    if (tile.base64 === b64){
      return 0;
    }
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
    return -1;
  }
}



