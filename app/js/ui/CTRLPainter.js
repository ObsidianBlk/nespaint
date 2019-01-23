
export class NESPainter { 
  constructor(canvas){
    this.__canvas = null;
    this.__context = null;
    this.__scale = 1.0;         // This is the scale the painter will display source information.
    this.__offset = [0.0, 0.0]; // This is the X,Y offset from origin to display source information.

    if (!canvas)
      throw new Error("Expected a canvas element.");
    this.__canvas = canvas;
    this.__context = this.__canvas.getContext("2d");
    if (!this.__context)
      throw new Error("Failed to obtain canvas context.");
  }

  get scale(){
    return this.__scale;
  }

  set scale(s){
    if (typeof(s) !== 'number')
      throw new TypeError("Expected number value.");
    this.__scale = Math.max(0.1, Math.min(100.0, s));
  }

  scale_up(amount=1){
    this.scale = this.scale + (amount*0.1);
  }

  scale_down(amount=1){
    this.scale = this.scale - (amount*0.1);
  }
}
