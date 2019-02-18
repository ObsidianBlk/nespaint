import Utils from "/app/js/common/Utils.js";
import GlobalEvents from "/app/js/common/EventCaller.js";

import Input from "/app/js/ui/Input.js";

import NESTile from "/app/js/models/NESTile.js";
import NESBank from "/app/js/models/NESBank.js";


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

    this.__surface = null;

    var self = this;

    var handle_change_surface = (function(surf){
      if (!(surf instanceof ISurface)){
        console.log("WARNING: Attempted to set painter to non-surface instance.");
        return;
      }
      this.__surface = surf;
      // TODO: Call a rerender
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
    // TODO: Call a rerender.
  }

  get scale(){
    return this.__scale;
  }

  set scale(s){
    if (typeof(s) !== 'number')
      throw new TypeError("Expected number value.");
    this.__scale = Math.max(0.1, Math.min(100.0, s));
  }

  initialize(){
    if (canvas === null){
      canvas = document.getElementById(EL_CANVAS_ID);
      if (!canvas)
        throw new Error("Failed to obtain the canvas element.");
      context = canvas.getContext("2d");
      if (!context)
        throw new Error("Failed to obtain canvas context.");
      input.mouseTargetElement = canvas;
    }
  }

  scale_up(amount=1){
    this.scale = this.scale + (amount*0.1);
  }

  scale_down(amount=1){
    this.scale = this.scale - (amount*0.1);
  }
}


const instance = new CTRLPainter();
export default instance;



