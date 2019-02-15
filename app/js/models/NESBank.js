
import Utils from "/app/js/common/Utils.js";
import NESTile from "/app/js/models/NESTile.js";
import NESPalette from "/app/js/models/NESPalette.js";


export default class NESBank {
  constructor(){
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
        return this.__LP[prop];
      },

      set: function(obj, prop, value){
        if (!Utils.isInt(prop))
          throw new TypeError("Expected integer index.");
        if (!(value instanceof NESTile))
          throw new TypeError("Can only assign NESTile objects.");
        prop = parseInt(prop);
        if (prop < 0 || prop >= 256)
          throw new RangeError("Index out of bounds.");
        this.__LP[prop].copy(value);
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
        return this.__RP[prop];
      },

      set: function(obj, prop, value){
        if (!Utils.isInt(prop))
          throw new TypeError("Expected integer index.");
        if (!(value instanceof NESTile))
          throw new TypeError("Can only assign NESTile objects.");
        prop = parseInt(prop);
        if (prop < 0 || prop >= 256)
          throw new RangeError("Index out of bounds.");
        this.__RP[prop].copy(value);
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
}




