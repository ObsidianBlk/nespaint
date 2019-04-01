import Utils from "/app/js/common/Utils.js"
import {EventCaller} from "/app/js/common/EventCaller.js"

export default class ISurface extends EventCaller{
  constructor(){
    super();
    this.__historyLength = 10;
  }

  get width(){return 0;}
  get height(){return 0;}
  get length(){return 0;}
  get historyLength(){return this.__historyLength;}
  get undos(){return 0;}
  get redos(){return 0;}

  get coloridx(){
    return new Proxy(this, {
      get: function(obj, prop){
        if (prop === "length")
          return 0;
        if (!Utils.isInt(prop))
          throw new TypeError("Expected integer index.");
        if (prop < 0)
          throw new RangeError("Index is out of bounds.");
        return this.getColor(-1,-1);
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

  snapshot(){return this;}
  undo(){return this;}
  redo(){return this;}
  clearUndos(){return this;}
  clearRedos(){return this;}
  clearHistory(){
    return this.clearUndos().clearRedos();
  }

  getColor(x, y){
    return this.__default_pi[4];
  }

  getColorIndex(x, y){
    return {pi:-1, ci:-1};
  }

  setColorIndex(x, y, ci, pi){
    return this;
  }


}
