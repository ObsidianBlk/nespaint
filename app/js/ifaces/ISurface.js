import Utils from "/app/js/common/Utils.js"


export default class ISurface{
  constructor(){
    this.__default_pi = [
      "#080808",
      "#343434",
      "#a2a2a2",
      "#efefef",
      "#666666" // Out of bounds color.
    ];
  }

  get width(){return 0;}
  get height(){return 0;}
  get length(){return 0;}

  get coloridx(){
    return new Proxy(this, {
      get: function(obj, prop){
        if (prop === "length")
          return 0;
        if (!Utils.isInt(prop))
          throw new TypeError("Expected integer index.");
        if (prop < 0)
          throw new RangeError("Index is out of bounds.");
        return obj.__default_pi[4];
      },

      set: function(obj, prop, value){
        if (!Utils.isInt(prop))
          throw new TypeError("Expected integer index.");
        if (prop < 0)
          throw new RangeError("Index out of bounds.");
        if (!Utils.isInt(value))
          throw new TypeError("Color index expected to be an integer.");
        if (value < 0 || value >= 4)
          throw new RangeError("Color index is out of bounds.");
        return true;
      }
    });
  }

  copy(b){return this;}
  clone(){return new ISurface();}

  getColor(x, y){
    return this.__default_pi[4];
  }

  setColorIndex(x, y, ci, pi){
    return this;
  }


}
