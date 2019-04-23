import ISurface from "/app/js/ifaces/ISurface.js";
import NESPalette from "/app/js/models/NESPalette.js";


function clear(ctx, color, cw, ch){
  if (typeof(cw) !== 'number'){
    cw = (Math.floor(ctx.canvas.clientWidth) > 0) ? 
      Math.floor(ctx.canvas.clientWidth) : 
      Math.floor(ctx.canvas.width);
  }

  if (typeof(ch) !== 'number'){
    ch = (Math.floor(ctx.canvas.clientHeight) > 0) ?
      Math.floor(ctx.canvas.clientHeight) :
      Math.floor(ctx.canvas.height);
  }

  ctx.save();
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, cw, ch);
  ctx.restore();
}


function render(surf, sx, sy, sw, sh, scale, ctx, dx, dy, palcolored){
  if (!(surf instanceof ISurface)){
    console.log("WARNING: Cannot render non-ISurface object.");
    return;
  }

  if (sx + sw > surf.width || sy + sh > surf.height){
    console.log("WARNING: Cannot render. Region is out of bounds.");
    return;
  }

  palcolored = (palcolored === true);

  var cw = (Math.floor(ctx.canvas.clientWidth) > 0) ? 
    Math.floor(ctx.canvas.clientWidth) : 
    Math.floor(ctx.canvas.width);

  var ch = (Math.floor(ctx.canvas.clientHeight) > 0) ?
    Math.floor(ctx.canvas.clientHeight) :
    Math.floor(ctx.canvas.height);

  if (cw <= 0 || ch <= 0){return;}

  clear(ctx, NESPalette.Default(4));

  ctx.save();
  var ctximg = ctx.getImageData(0, 0, cw, ch);
  var idat = ctximg.data;

  var PutPixel = (i,j,s,c) => {
    i = Math.round(i);
    j = Math.round(j);
    s = Math.ceil(s);

    var r = parseInt(c.substring(1, 3), 16);
    var g = parseInt(c.substring(3, 5), 16);
    var b = parseInt(c.substring(5, 7), 16);

    for (var y=j; y < j+s; y++){
      for (var x=i; x < i+s; x++){
        if (x >= 0 && x < cw && y >= 0 && y < ch){
          var index = (y*cw*4) + (x*4);
          idat[index] = r;
          idat[index+1] = g;
          idat[index+2] = b;
          idat[index+3] = 255;
        }
      }
    }
  };


  for (let j=sy; j < sy + sh; j++){
    var y = (j*scale) + dy;
    for (let i=sx; i < sx + sw; i++){
      var x = (i*scale) + dx;

      if (x >= 0 && x < cw && y >= 0 && y < ch){
        var color = NESPalette.Default(4);
        if (palcolored){
          color = surf.getColor(i, j);
        } else {
          var pinfo = surf.getColorIndex(i, j);
          color = (pinfo.ci >= 0) ? NESPalette.Default(pinfo.ci) : NESPalette.Default(4);
        }
        PutPixel(x,y,scale,color);
      }
    }
  } 

  ctx.putImageData(ctximg, 0, 0); 
  ctx.restore();
}



function renderToFit(surf, ctx, palcolored){
  if (!(surf instanceof ISurface)){
    console.log("WARNING: Cannot render non-ISurface object.");
    return;
  }

  palcolored = (palcolored === true);

  var cw = (Math.floor(ctx.canvas.clientWidth) > 0) ? 
    Math.floor(ctx.canvas.clientWidth) : 
    Math.floor(ctx.canvas.width);

  var ch = (Math.floor(ctx.canvas.clientHeight) > 0) ?
    Math.floor(ctx.canvas.clientHeight) :
    Math.floor(ctx.canvas.height);

  if (cw <= 0 || ch <= 0){return;}

  var scale = Math.min(
    cw/surf.width,
    ch/surf.height
  );
  var offX = Math.floor((cw - (surf.width*scale)) * 0.5);
  var offY = Math.floor((ch - (surf.height*scale)) * 0.5);

  render(surf, 0, 0, surf.width, surf.height, scale, ctx, offX, offY, palcolored);
}



export default {
  clear: clear,
  render: render,
  renderToFit: renderToFit
};
