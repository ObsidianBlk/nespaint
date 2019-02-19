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

// Handling window resize events...
var HANDLE_Resize = Utils.debounce(function(e){
  if (canvas !== null){
    var w = canvas.clientWidth;
    var h = canvas.clientHeight;
    canvas.width = w;
    canvas.height = h;
    GlobalEvents.emit("resize", w, h);
  }
}, 250);
window.addEventListener("resize", HANDLE_Resize);


// Setting-up Input controls.
var input = new Input();
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
      this.render();
    }).bind(this);
    GlobalEvents.listen("change_surface", handle_change_surface);

    var handle_color_change = (function(pi, ci){
      this.__brushPalette = pi;
      this.__brushColor = ci;
    }).bind(this);
    GlobalEvents.listen("active_palette_color", handle_color_change);
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
      input.mouseTargetElement = canvas;
    }
  }

  scale_up(amount=1){
    this.scale = this.scale + (amount*0.1);
  }

  scale_down(amount=1){
    this.scale = this.scale - (amount*0.1);
  }

  render(){
    if (context === null || this.__surface === null)
      return;

    // Get the contexts initial fillStyle. Don't want the render operation to override it.
    var fillStyle = context.fillStyle;

    var ie = this.__surface.width - this.__offset[0];
    var je = this.__surface.height - this.__offset[1];
    var scalemult = 1.0/this.__scale;

    // Clearing the context surface...
    context.fillStyle = NESPalette.Default[4];
    context.fillRect(
      0,0,
      Math.floor(canvas.clientWidth),
      Math.floor(canvas.clientHeight)
    );

    for (var j = -this.__offset[1]; j < je; j++){
      var y = Math.floor(j*scalemult);
      for (var i = -this.__offset[0]; i < ie; i++){
        var x = Math.floor(i*scalemult);
        
        var color = "#666666";
        if (this.__onePaletteMode){
          var pinfo = this.__surface.getColorIndex(x, y);
          if (pinfo.ci >= 0)
            color = NESPalette.Default[pinfo.ci];
        } else {
          color = this.__surface.getColor(x, y);
        }

        context.fillStyle = color;
        context.fillRect(
          i + this.__offset[0],
          j + this.__offset[1],
          1, 1
        );
      }
    }

    if (this.__gridEnabled && this.__scale > 0.5){
      // TODO: render the grid!
    }

    // Return to the context's initial fillStyle.
    context.fillStyle = fillStyle;
  }
}


const instance = new CTRLPainter();
export default instance;



