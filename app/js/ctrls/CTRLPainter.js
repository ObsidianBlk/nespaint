import Utils from "/app/js/common/Utils.js";
import GlobalEvents from "/app/js/common/EventCaller.js";

import Input from "/app/js/ui/Input.js";

import NESPalette from "/app/js/models/NESPalette.js";
//import NESTile from "/app/js/models/NESTile.js";
//import NESBank from "/app/js/models/NESBank.js";
import ISurface from "/app/js/ifaces/ISurface.js";

const EL_CANVAS_ID = "painter";


/* --------------------------------------------------------------------
 * Univeral data and functions.
 ------------------------------------------------------------------- */

var canvas = null;
var context = null;
var ctximg = null;

function OpenCanvasPixels(){
  if (context !== null){
    if (ctximg === null){
      ctximg = context.getImageData(0,0,Math.floor(canvas.clientWidth),Math.floor(canvas.clientHeight));
    }
    return (ctximg !== null)
  }
  return false;
}

function PutCanvasPixel(i,j,size,color){
  if (ctximg === null)
    return;

  size = Math.ceil(size);
  if (size <= 0){return;}

  var cw = Math.floor(canvas.clientWidth);
  var ch = Math.floor(canvas.clientHeight);

  var r = parseInt(color.substring(1, 3), 16);
  var g = parseInt(color.substring(3, 5), 16);
  var b = parseInt(color.substring(5, 7), 16);
  
  var idat = ctximg.data;
  for (var y=j; y < j+size; y++){
    for (var x=i; x < i+size; x++){
      if (x >= 0 && x < cw && y >= 0 && y < ch){
        var index = (y*cw*4) + (x*4);
        idat[index] = r;
        idat[index+1] = g;
        idat[index+2] = b;
      }
    }
  }

}

function CloseCanvasPixels(){
  if (ctximg !== null){
    context.putImageData(ctximg, 0, 0);
    ctximg = null;
  }
}

function ResizeCanvasImg(w, h){
  if (canvas !== null){
    canvas.width = w;
    canvas.height = h;
  }
};

// Handling window resize events...
var HANDLE_Resize = Utils.debounce(function(e){
  if (canvas !== null){
    ResizeCanvasImg(
      canvas.clientWidth,
      canvas.clientHeight
    );
    GlobalEvents.emit("resize", canvas.clientWidth, canvas.clientHeight);
  }
}, 250);
window.addEventListener("resize", HANDLE_Resize);


// Setting-up Input controls.
var input = new Input();
input.enableKeyboardInput(true);
input.enableMouseInput(true);
input.preventDefaults = true;

// Mouse handling...
/*input.listen("mousemove", handle_mouseevent);
input.listen("mousedown", handle_mouseevent);
input.listen("mouseup", handle_mouseevent);
input.listen("mouseclick", handle_mouseclickevent);
*/


/* --------------------------------------------------------------------
 * CTRLPainter
 * Actual controlling class.
 ------------------------------------------------------------------- */

// For reference...
// https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/stroke 
class CTRLPainter { 
  constructor(){
    this.__scale = 1.0;         // This is the scale the painter will display source information.
    this.__offset = [0.0, 0.0]; // This is the X,Y offset from origin to display source information.
    this.__onePaletteMode = true; // If true, ALL tiles will be drawing using the same palette.

    this.__brushSize = 1;
    this.__brushColor = 0;
    this.__brushPalette = 0;

    this.__gridEnabled = false;
    this.__gridSize = 1;

    this.__surface = null;

    var self = this;

    var RenderD = Utils.throttle((function(){
      this.render();
    }).bind(this), 20);

    var handle_resize = (function(w,h){
      this.render();
    }).bind(this);
    GlobalEvents.listen("resize", handle_resize);

    var handle_change_surface = (function(surf){
      if (!(surf instanceof ISurface)){
        console.log("WARNING: Attempted to set painter to non-surface instance.");
        return;
      }
      this.__surface = surf;
      this.center_surface();
      RenderD();
    }).bind(this);
    GlobalEvents.listen("change_surface", handle_change_surface);

    var handle_color_change = (function(pi, ci){
      this.__brushPalette = pi;
      this.__brushColor = ci;
    }).bind(this);
    GlobalEvents.listen("active_palette_color", handle_color_change);

    var handle_offset = (function(e){
      this.__offset[0] += e.x - e.lastX;
      this.__offset[1] += e.y - e.lastY;
      RenderD();
    }).bind(this);
    input.listen("shift+mouseleft+mousemove", handle_offset);

    var handle_scale = (function(e){
      if (e.delta < 0){
        this.scale_down();
      } else if (e.delta > 0){
        this.scale_up();
      }
      if (e.delta !== 0)
        RenderD();
    }).bind(this);
    input.listen("wheel", handle_scale);
  }




  get onePaletteMode(){return this.__onePaletteMode;}
  set onePaletteMode(e){
    this.__onePaletteMode = (e === true);
    this.render();
  }

  get scale(){
    return this.__scale;
  }

  set scale(s){
    if (typeof(s) !== 'number')
      throw new TypeError("Expected number value.");
    this.__scale = Math.max(0.1, Math.min(100.0, s));
  }

  get showGrid(){return this.__gridEnabled;}
  set showGrid(e){
    this.__gridEnabled = (e === true);
  }




  initialize(){
    if (canvas === null){
      canvas = document.getElementById(EL_CANVAS_ID);
      if (!canvas)
        throw new Error("Failed to obtain the canvas element.");
      context = canvas.getContext("2d");
      if (!context)
        throw new Error("Failed to obtain canvas context.");
      context.imageSmoothingEnabled = false;
      ResizeCanvasImg(canvas.clientWidth, canvas.clientHeight); // A forced "resize".
      input.mouseTargetElement = canvas;

      this.center_surface();
    }
    return this;
  }

  scale_up(amount=1){
    this.scale = this.scale + (amount*0.1);
    return this;
  }

  scale_down(amount=1){
    this.scale = this.scale - (amount*0.1);
    return this;
  }

  center_surface(){
    if (canvas === null || this.__surface === null)
      return;

    this.__offset[0] = Math.floor((canvas.clientWidth - this.__surface.width) * 0.5);
    this.__offset[1] = Math.floor((canvas.clientHeight - this.__surface.height) * 0.5);
    return this;
  }

  render(){
    if (context === null || this.__surface === null)
      return;

    // Get the contexts initial fillStyle. Don't want the render operation to override it.
    var fillStyle = context.fillStyle;

    var scalemult = 1.0/this.__scale;

    // Clearing the context surface...
    context.fillStyle = NESPalette.Default[4];
    context.fillRect(
      0,0,
      Math.floor(canvas.clientWidth),
      Math.floor(canvas.clientHeight)
    );

    OpenCanvasPixels();
    for (var j = 0; j < this.__surface.height; j++){
      var y = Math.floor((j*scalemult) + this.__offset[1]);
      for (var i = 0; i < this.__surface.width; i++){
        var x = Math.floor((i*scalemult) + this.__offset[0]);
        
        if (x >= 0 && x < canvas.clientWidth && y >= 0 && y < canvas.clientHeight){
          var color = NESPalette.Default[4];
          if (this.__onePaletteMode){
            var pinfo = this.__surface.getColorIndex(i, j);
            if (pinfo.ci >= 0)
              color = NESPalette.Default[pinfo.ci];
          } else {
            color = this.__surface.getColor(i, j);
          }

          PutCanvasPixel(x,y, scalemult, color);
          //context.fillStyle = color;
          //context.fillRect(
          //  x,y,
          //  Math.ceil(scalemult), Math.ceil(scalemult)
          //); 
        }
      }
    }
    CloseCanvasPixels();

    if (this.__gridEnabled && this.__scale > 0.5){
      // TODO: render the grid!
    }

    // Return to the context's initial fillStyle.
    context.fillStyle = fillStyle;

    return this;
  }
}


const instance = new CTRLPainter();
export default instance;



