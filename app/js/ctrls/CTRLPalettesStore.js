import GlobalEvents from "/app/js/common/EventCaller.js";
import Utils from "/app/js/common/Utils.js";
import NESPalette from "/app/js/models/NESPalette.js";


var Palettes = [];
var CurrentPaletteIndex = 0;

var BlockEmits = false;

class CTRLPalettesStore{
  constructor(){}

  get json(){
    var d = {
      cpi: CurrentPaletteIndex,
      pals: []
    };
    for (let i=0; i < Palettes.length; i++){
      d.pals.push([Palettes[i][0], Palettes[i][1].json]);
    }
    return JSON.stringify(d);
  }

  set json(j){
    try {
      var d = JSON.parse(j);
    } catch (e) {
      throw e;
    }

    if (d.hasOwnProperty("cpi") && d.hasOwnProperty("pals")){
      if (Utils.isInt(d.cpi) && d.pals instanceof Array){
        var newPalettes = []
        for (let i=0; i < d.pals.length; i++){
          if (d.pals[i] instanceof Array){
            if (this.getPalette(d.pals[i][0]) === null){
              var palette = new NESPalette();
              try{
                palette.json = d.pals[i][1]
              } catch (e) {
                console.log("Failed to create palette.", e.toString());
                palette = null;
              }
              if (palette !== null){
                newPalettes.push([d.pals[i][0], palette]);
              }
            }
          }
        }
        CurrentPaletteIndex = 0
        if (newPalettes.length > 0){
          if (d.cpi >= 0 && d.cpi < newPalettes.length){
            CurrentPaletteIndex = d.cpi;
          }
          Palettes = newPalettes;
          GlobalEvents.emit("set_app_palette", Palettes[CurrentPaletteIndex][1]);
        }
      } else {
        throw new TypeError("JSON Property Value types invalid.");
      }
    } else {
      throw new TypeError("JSON missing expected properties.");
    }
  }

  initialize(){
    if (Palettes.length <= 0)
      this.createPalette("Palette");
    return this;
  }

  paletteIndexFromName(name){
    for (let i=1; i < Palettes.length; i++){
      if (Palettes[i][0] == name){
        return i;
      }
    }
    return -1;
  }

  getPalette(name){
    var i = this.paletteIndexFromName(name);
    return (i >= 0) ? Palettes[i][1] : null;
  }

  createPalette(name){
    var palette = this.getPalette(name);
    if (palette === null){
      palette = new NESPalette();
      palette.set_palette([
        "0F",
        "05","06","07",
        "09","0A","0B",
        "01","02","03",
        "0D","00","20",
        "15","16","17",
        "19","1A","1B",
        "11","21","31",
        "1D","10","30"
      ]);
      Palettes.push([name, palette]);
      // TODO: Create an HTML entry for this new palette.

      if (Palettes.length <= 1 && !BlockEmits){
        GlobalEvents.emit("set_app_palette", palette);        
      }
    }
    return this;
  }

  removePalette(name){
    // TODO: Write this function.
    return this;
  }

  renamePalette(oldname, newname){
    var i = paletteIndexFromName(oldname);
    if (i < 0)
      throw new ValueError("Failed to find palette named '" + oldname +"'. Cannot rename.");
    Palettes[i][0] = newname;
    return this;
  }

  activatePalette(name){
    var i = this.paletteIndexFromName(name);
    if (i >= 0 && CurrentPaletteIndex !== i){
      CurrentPaletteIndex = i;
      if (!BlockEmits){
        GlobalEvents.emit("set_app_palette", Palettes[pindex][1]);
      }
      // TODO: Highlight palette HTML entry and unhighlight old one.
    }
    return this;
  }
}


const instance = new CTRLPalettesStore();
export default instance;



