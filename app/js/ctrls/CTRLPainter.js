import Utils from "/app/js/common/Utils.js";
import GlobalEvents from "/app/js/common/EventCaller.js";

import Input from "/app/js/ui/Input.js";
import Renderer from "/app/js/ui/Renderer.js";

import NESPalette from "/app/js/models/NESPalette.js";
import ISurface from "/app/js/ifaces/ISurface.js";

const EL_CANVAS_ID = "painter";


/* --------------------------------------------------------------------
 * Univeral data and functions.
 ------------------------------------------------------------------- */

var canvas = null;
var context = null;
var ctximg = null;


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
input.preventDefaults = true;


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
    this.__brushLastPos = [0.0, 0.0];
    this.__brushPos = [0.0, 0.0];
    this.__brushColor = 0;
    this.__brushPalette = 0;

    this.__gridEnabled = false;
    this.__gridSize = 1;

    this.__surface = null;
    this.__palette = null;


    this.__snapshotTriggered = false;

    // var self = this;

    var RenderD = Utils.throttle((function(){
      this.render();
    }).bind(this), 20);

    var LineToSurface = (function(x0, y0, x1, y1, ci, pi){
      var dx = x1 - x0;
      var ix = Math.sign(dx);
      dx = 2 * Math.abs(dx);

      var dy = y1 - y0;
      var iy = Math.sign(dy);
      dy = 2 * Math.abs(dy);

      if (dx > dy){
        var err = dy - (dx/2);
        var y = y0;

        Utils.range(x0, x1, 1).forEach((x) => {
          this.__surface.setColorIndex(x, y, ci, pi);
          if (err > 0 || (err == 0 && ix > 0)){
            err -= dx;
            y += iy;
          }
          err += dy;
        });
      } else {
        var err = dx - (dy/2);
        var x = x0;

        Utils.range(y0, y1, 1).forEach((y) => {
          this.__surface.setColorIndex(x, y, ci, pi);
          if (err > 0 || (err == 0 && iy > 0)){
            err -= dy;
            x += ix;
          }
          err += dx;
        });
      }
    }).bind(this);

    var handle_resize = (function(w,h){
      RenderD();
    }).bind(this);
    GlobalEvents.listen("resize", handle_resize);

    var handle_palinfochanged = (function(pdat){
      RenderD();
    }).bind(this);

    var handle_setapppalette = (function(pal){
      if (this.__palette !== null)
        this.__palette.unlisten("palettes_changed", handle_palinfochanged);
      this.__palette = pal;
      this.__palette.listen("palettes_changed", handle_palinfochanged);
      if (this.__surface !== null){
        this.__surface.palette = pal;
        if (this.__onePaletteMode === false)
          RenderD();
      }
    }).bind(this);
    GlobalEvents.listen("set_app_palette", handle_setapppalette);

    var handle_surface_data_changed = (function(){
      RenderD();
    }).bind(this);

    var handle_change_surface = (function(surf){
      if (surf !== null && !(surf instanceof ISurface)){
        console.log("WARNING: Attempted to set painter to non-surface instance.");
        return;
      }
      if (surf !== this.__surface){
        if (this.__surface !== null){
          this.__surface.unlisten("data_changed", handle_surface_data_changed);
        }
        this.__surface = surf;
        if (this.__surface !== null){
          this.__surface.listen("data_changed", handle_surface_data_changed);
          if (this.__palette === null && this.__surface.palette !== null){
            this.__palette = this.__surface.palette;
          } else if (this.__palette !== null && this.__surface.palette !== this.__palette){
            this.__surface.palette = this.__palette;
          }
          this.scale_to_fit();
          this.center_surface();
        }
      }
      RenderD();
    }).bind(this);
    GlobalEvents.listen("change_surface", handle_change_surface);

    var handle_color_change = (function(pi, ci){
      this.__brushPalette = pi;
      this.__brushColor = ci;
    }).bind(this);
    GlobalEvents.listen("active_palette_color", handle_color_change);

    var handle_mousemove = (function(e){
      this.__brushLastPos[0] = this.__brushPos[0];
      this.__brushLastPos[1] = this.__brushPos[1];
      this.__brushPos[0] = e.x;
      this.__brushPos[1] = e.y;
      if (this.__surface !== null){
        var x = Math.floor((this.__brushPos[0] - this.__offset[0]) * (1.0 / this.__scale));
        var y = Math.floor((this.__brushPos[1] - this.__offset[1]) * (1.0 / this.__scale));
        if (x >= 0 && x < this.__surface.width && y >= 0 && y < this.__surface.height){
          RenderD();
        }
      }
    }).bind(this);
    input.listen("mousemove", handle_mousemove);
    input.listen("mouseleft+mousemove", handle_mousemove);

    var handle_draw = (function(e){
      if (e.isCombo || e.button == 0){
        if (this.__surface !== null){
          //console.log(this.__brushPos);
          //console.log(this.__brushLastPos);
          var x = Math.floor((this.__brushPos[0] - this.__offset[0]) * (1.0 / this.__scale));
          var y = Math.floor((this.__brushPos[1] - this.__offset[1]) * (1.0 / this.__scale));
          var sx = (e.isCombo) ? Math.floor((this.__brushLastPos[0] - this.__offset[0]) * (1.0 / this.__scale)) : x;
          var sy = (e.isCombo) ? Math.floor((this.__brushLastPos[1] - this.__offset[1]) * (1.0 / this.__scale)) : y;
          if (x >= 0 && x < this.__surface.width && y >= 0 && y < this.__surface.height){
            if (!this.__snapshotTriggered){
              this.__snapshotTriggered = true;
              this.__surface.snapshot();
            }
            LineToSurface(sx, sy, x, y, this.__brushColor, this.__brushPalette);
          }
        }
      }
    }).bind(this);
    input.listen("mouseclick", handle_draw);
    input.listen("mouseleft+mousemove", handle_draw);

    var handle_mouseup = (function(e){
      this.__snapshotTriggered = false;
    }).bind(this);
    input.listen("mouseup", handle_mouseup);

    var handle_undo = (function(e){
      if (this.__surface !== null){
        this.__surface.undo();
      }
    }).bind(this);
    input.listen("ctrl+z", handle_undo);

    var handle_redo = (function(e){
      if (this.__surface !== null){
        this.__surface.redo();
      }
    }).bind(this);
    input.listen("ctrl+y", handle_redo);

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


    var elscale = document.querySelector("#painter_scale");
    if (elscale){
      var self = this;
      elscale.addEventListener("change", function(e){
        var val = Number(this.value);
        self.scale = val; 
        RenderD();
      });
      elscale.value = this.__scale;
    }

    var handle_fittocanvas = (function(){
      this.scale_to_fit();
      this.center_surface();
      RenderD();
    }).bind(this);
    GlobalEvents.listen("painter-fit-to-canvas", handle_fittocanvas);

    var handle_togglegrid = (function(target, args){
      if (args.show){
        target.classList.add("pure-button-active");
        target.setAttribute("emit-args", JSON.stringify({show:false}));
        this.__gridEnabled = true;
      } else {
        target.classList.remove("pure-button-active");
        target.setAttribute("emit-args", JSON.stringify({show:true}));
        this.__gridEnabled = false;
      }
      RenderD();
    }).bind(this);
    GlobalEvents.listen("painter-togglegrid", handle_togglegrid);


    var handle_colormode = (function(target, args){
      if (args.onePaletteMode){
        target.classList.remove("pure-button-active");
        target.setAttribute("emit-args", JSON.stringify({onePaletteMode:false}));
        this.__onePaletteMode = true;
      } else {
        target.classList.add("pure-button-active");
        target.setAttribute("emit-args", JSON.stringify({onePaletteMode:true}));
        this.__onePaletteMode = false;
      }
      RenderD();
    }).bind(this);
    GlobalEvents.listen("painter-colormode", handle_colormode);
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
    var elscale = document.querySelector("#painter_scale");
    if (elscale){
      elscale.value = this.__scale;
    }
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
      input.enableMouseInput(true, canvas);
      input.enableKeyboardInput(true);
      //input.mouseTargetElement = canvas;

      this.scale_to_fit();
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

    this.__offset[0] = Math.floor((canvas.clientWidth - (this.__surface.width * this.__scale)) * 0.5);
    this.__offset[1] = Math.floor((canvas.clientHeight - (this.__surface.height * this.__scale)) * 0.5);
    return this;
  }

  scale_to_fit(){
    if (canvas === null || this.__surface === null)
      return;

    var sw = canvas.clientWidth / this.__surface.width;
    var sh = canvas.clientHeight / this.__surface.height;
    var s = Math.min(sw, sh).toString();
    var di = s.indexOf(".");
    if (di >= 0)
      s = s.slice(0, di+2);
    this.scale = Number(s);
  }

  renderCursor(){
    if (context === null || this.__surface === null){return this;} 

    // Draw the mouse position... if mouse is currently in bounds.
    if (input.isMouseInBounds()){
      context.save();
      context.fillStyle = "#AA9900";
      var x = Math.floor((this.__brushPos[0] - this.__offset[0]) * (1.0/this.__scale));
      var y = Math.floor((this.__brushPos[1] - this.__offset[1]) * (1.0/this.__scale));
      if (x >= 0 && x < this.__surface.width && y >= 0 && y < this.__surface.height){
        context.beginPath();
        context.rect(
          this.__offset[0] + (x*this.__scale),
          this.__offset[1] + (y*this.__scale),
          Math.ceil(this.__scale),
          Math.ceil(this.__scale)
        );
        context.fill();
        context.closePath();
      }
      context.restore();
    }
 
    return this;
  }

  renderGrid(){
    if (context === null || this.__surface === null){return this;}
    context.save();

    // Draw grid.
    if (this.__gridEnabled && this.__scale > 0.5){
      context.strokeStyle = "#00FF00";

      var w = this.__surface.width * this.__scale;
      var h = this.__surface.height * this.__scale;

      var length = Math.max(this.__surface.width, this.__surface.height);
      for (var i=0; i < length; i += 8){
        var x = (i*this.__scale) + this.__offset[0];
        var y = (i*this.__scale) + this.__offset[1];

        if (i < this.__surface.width){
          context.beginPath();
          context.moveTo(x, this.__offset[1]);
          context.lineTo(x, this.__offset[1] + h);
          context.stroke();
          context.closePath();
        }

        if (i < this.__surface.height){
          context.beginPath();
          context.moveTo(this.__offset[0], y);
          context.lineTo(this.__offset[0] + w, y);
          context.stroke();
          context.closePath();
        }
      }
    }

    context.restore();

    return this;
  }

  render(){
    if (context === null){return this;}
    if (this.__surface === null){
      Renderer.clear(context, NESPalette.Default[4]);
      return this;      
    }

    // Drawing the surface to the canvas.
    Renderer.render(
      this.__surface,
      0, 0,
      this.__surface.width, this.__surface.height,
      this.__scale,
      context,
      this.__offset[0], this.__offset[1],
      !this.__onePaletteMode
    );
 
    return this.renderCursor().renderGrid();
  }
}


const instance = new CTRLPainter();
export default instance;



