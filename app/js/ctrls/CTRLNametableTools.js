import Utils from "/app/js/common/Utils.js";
import GlobalEvents from "/app/js/common/EventCaller.js";
import Renderer from "/app/js/ui/Renderer.js";
import NESNameTable from "/app/js/models/NESNameTable.js";
import CTRLBanksStore from "/app/js/ctrls/CTRLBanksStore.js";

const TILE_SELECT_CLS = "canvas-item-selected";

var ELCtrl = null;
var SURF = null;
var TileIndex = -1;

function UpdateBankList(curbankname){
  var elsel = ELCtrl.querySelector(".nametable-bank-select");
  if (elsel){
    var child = elsel.firstChild;
    
    // Clear old bank names...
    while(child !== null){
      let nchild = child.nextSibling;
      let drop = true;
      if (Utils.isElement(child)){
        if (child.hasAttribute("value")){
          if (child.getAttribute("value") === "NULL_BANK"){
            drop = false;
          }
        }
      }
      if (drop){
        elsel.removeChild(child);
      }
      child = nchild;
    }

    // Get the only remaining option...
    var elop = elsel.querySelector("option");

    // Get the current list of bank names...
    var banknames = CTRLBanksStore.keys;

    // Loop through bank names, if there are any, and add new options to the list...
    if (elop && banknames.length > 0){
      banknames.forEach((name) => {
        var newop = elop.cloneNode(true);
        newop.setAttribute("value", name);
        newop.innerHTML = name;
        elsel.appendChild(newop);
      });

      elsel.value = curbankname;
    }
  }
}

function UpdateBankTileList(){
  var el = ELCtrl.querySelector(".nametable-tile");
  if (el){
    if (SURF.bank === null){
      el.classList.add("hidden");
    } else {
      var elsel = ELCtrl.querySelector(".nametable-tile-select");
      if (elsel){
        el.classList.remove("hidden");
        let tiles = SURF.bank.rp;
        for (let i=0; i < tiles.length; i++){
          let cnv = elsel.querySelector('canvas[value="' + i + '"]'); 
          if (cnv){
            var psize = Math.floor(cnv.parentNode.clientWidth * 0.9);
            if (cnv.clientWidth !== psize){
              cnv.width = psize;
              cnv.height = psize;
            }
            let ctx = cnv.getContext("2d");
            let tsurf = new Renderer.NESTileSurface(tiles[i], SURF.palette, 0);
            Renderer.renderToFit(tsurf, ctx);
          }
        } 
      }
    }
  }
}


function OpenControls(){
  if (ELCtrl !== null && SURF !== null){
    var curbankname = (SURF.bank !== null) ? CTRLBanksStore.getBankName(SURF.bank) : "NULL_BANK";
    if (curbankname === null){
      SURF.bank = null;
      curbankname = "NULL_BANK";
    }
    ELCtrl.classList.remove("hidden");
    UpdateBankList(curbankname);
    UpdateBankTileList(); 
  }
}


function CloseControls(){
  if (ELCtrl !== null){
    ELCtrl.classList.add("hidden");
  }
}


function HANDLE_PaintNametable(x, y){
  if (TileIndex >= 0 && TileIndex < 256){
    SURF.setTileIndex(x, y, TileIndex);
  }
}

function ResetSelectedTile(){
  var eltilesel = ELCtrl.querySelector(".nametable-tile-select");
  if (eltilesel){
    var op = eltilesel.querySelector('canvas[selected="True"]');
    if (op){
      op.classList.remove(TILE_SELECT_CLS);
      op.removeAttribute("selected");
    }
  }
  TileIndex = -1;
}

function HANDLE_SurfChange(surf){ 
  if (surf instanceof NESNameTable){
    if (SURF !== null)
        SURF.unlisten("paint_nametable", HANDLE_PaintNametable);
    SURF = surf;
    SURF.listen("paint_nametable", HANDLE_PaintNametable);
    ResetSelectedTile();
    OpenControls();
  } else {
    if (SURF !== null)
      SURF.unlisten("paint_nametable", HANDLE_PaintNametable);
    SURF = null;
    CloseControls();
  }
}



class CTRLNametableTools{
  constructor(){
    GlobalEvents.listen("change_surface", HANDLE_SurfChange);
  }

  initialize(){
    ELCtrl = document.querySelector(".toolbar-nametable-control");
    if (!ELCtrl)
      throw new Error("Failed to find element class 'toolbar-nametable-control'.");

    var elbanksel = ELCtrl.querySelector(".nametable-bank-select");
    if (!elbanksel)
      throw new Error("Failed to find element class 'nametable-bank-select' within toolbar.");

    // Building out and setting up the tile selections.
    var eltilesel = ELCtrl.querySelector(".nametable-tile-select");
    if (!eltilesel)
      throw new Error("Failed to find element class 'nametable-tile-select' within toolbar.");


    var HANDLE_TileSelect = function(){
      var oop = eltilesel.querySelector('canvas[selected="True"]');
      if (oop){
        oop.classList.remove(TILE_SELECT_CLS);
        oop.removeAttribute("selected");
      }
      this.setAttribute("selected", "True");
      this.classList.add(TILE_SELECT_CLS);
      TileIndex = parseInt(this.getAttribute("value"));
    };
    var op0 = eltilesel.querySelector('canvas[value="0"]');
    if (!op0)
      throw new Error("Failed to find initial canvas element within 'nametable-tile-select'.");

    op0.addEventListener("click", HANDLE_TileSelect);
    for (let i=1; i < 256; i++){
      let op = eltilesel.querySelector('canvas[value="' + i + '"]');
      if (!op){
        op = op0.cloneNode(true);
        op.setAttribute("value", i);
        eltilesel.appendChild(op);
        op.addEventListener("click", HANDLE_TileSelect);
      }
    }

    elbanksel.addEventListener("change", function(){
      if (SURF !== null){
        var bankname = this.value;
        if (bankname === "NULL_BANK"){
          SURF.bank = null;
        } else {
          var bank = CTRLBanksStore.getBank(bankname);
          if (bank !== null){
            if (SURF.bank === null || (SURF.bank.eq(bank) === false)){
              SURF.bank = bank;
              UpdateBankTileList();
            }
          }
        }
      }
    });
  }
}



const instance = new CTRLNametableTools();
export default instance;




