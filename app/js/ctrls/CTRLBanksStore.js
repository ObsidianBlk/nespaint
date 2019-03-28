import GlobalEvents from "/app/js/common/EventCaller.js";
import Utils from "/app/js/common/Utils.js";
import NESBank from "/app/js/models/NESBank.js";



const BLI_TEMPLATE = "bank-list-item-template";
const BLI_CANVAS = "bank-img";
const BLI_TITLE = "title";
const BLI_SELECTED = "list-item-selected";


var Banks = {};
var CurrentBank = "";


function HANDLE_BankClick(e){
  var name = this.getAttribute("bankname");
  if (name !== CurrentBank){
    if (CurrentBank !== "")
      Banks[CurrentBank].el.classList.remove(BLI_SELECTED);
    CurrentBank = name;
    Banks[CurrentBank].el.classList.add(BLI_SELECTED);
    GlobalEvents.emit("change_surface", Banks[CurrentBank].bank);
  }
}


function SetElBankName(el, name){
  el.setAttribute("bankname", name);
  var sel = el.querySelector("." + BLI_TITLE);
  if (sel){
    sel.innerHTML = name;
  }
}


var RenderBankToEl = Utils.throttle(function(el, bank){
  var cnv = el.querySelector("." + BLI_CANVAS);
  var ctx = cnv.getContext("2d");
  var cw = (cnv.clientWidth > 0) ? Math.floor(cnv.clientWidth) : Math.floor(cnv.width);
  var ch = (cnv.clientHeight > 0) ? Math.floor(cnv.clientHeight) : Math.floor(cnv.height);
  if (cw <= 0 || ch <= 0){return;}
  var ctximg = ctx.getImageData(0,0,cw,ch);

  var idat = ctximg.data;
  for (let y=0; y < ch; y++){
    for (let x=0; x < cw; x++){
      var index = (y*(cw*4)) + (x*4);
      idat[index] = 0;
      idat[index+1] = 0;
      idat[index+2] = 0;
      idat[index+3] = 255;
    }
  }

  ctx.putImageData(ctximg, 0, 0);
}, 500); // Only update twice a second.


function HANDLE_BankDataChange(bank, e){
  RenderBankToEl(this, bank);
}

function ConnectElementToBank(el, bank){
  bank.listen("data_changed", HANDLE_BankDataChange.bind(el, bank));
}


function CreateBankDOMEntry(name, bank){
  var baseel = document.querySelector("." + BLI_TEMPLATE);
  if (!baseel){
    console.log("WARNING: Failed to find bank list item template.");
    return null;
  }
  var el = baseel.cloneNode(true);
  el.classList.remove(BLI_TEMPLATE);
  el.classList.remove("hidden");
  el.setAttribute("bankname", name);
  ConnectElementToBank(el, bank);
  SetElBankName(el, name); 
  el.addEventListener("click", HANDLE_BankClick);
  baseel.parentNode.appendChild(el);
  setTimeout(()=>{
    RenderBankToEl(el, bank);
  }, 500); // Make the render call in about a half second. Allow DOM time to catch up?
  return el;
}


class CTRLBanksStore{
  constructor(){
    var HANDLE_ChangeSurface = function(surf){
      if (!(surf instanceof NESBank)){
        // TODO: Unselect any current bank element.
        CurrentBankIndex = "";
      } else {
        if (Banks.length <= 0 || (CurrentBank !== "" && Banks[CurrentBank].bank !== surf)){
          console.log("WARNING: Bank object being set outside of Bank Store.");
        }
      }
    }
    GlobalEvents.listen("change_surface", HANDLE_ChangeSurface);
  }

  get length(){
    return Object.keys(Banks).length;
  }

  get json(){
    var data = [];
    Object.keys(Banks).forEach((key) => {
      if (Banks.hasOwnProperty(key)){
        data.push({name:key, data:Banks[key].bank.base64});
      }
    });
    return JSON.stringify(data);
  }

  initialize(){
    if (this.length <= 0){
      this.createBank("Bank");
    }
    return this;
  }


  createBank(name, bbase64){
    if (!(name in Banks)){
      var bank = new NESBank();
      if (typeof(bbase64) === "string"){
        try {
          bank.base64 = bbase64; 
        } catch (e) {
          console.log("Failed to create Bank. " + e.toString());
          bank = null;
        }
      }
      if (bank !== null){
        var el = CreateBankDOMEntry(name, bank);
        if (el){
          Banks[name] = {bank:bank, el:el};
          //Banks.push([name, bank, el]);

          if (this.length <= 1){
            Banks[name].el.click();
            //GlobalEvents.emit("change_surface", bank);
          }
        }
      }
    }
    return this;
  }


  removeBank(name){
    if (name in Banks){
      if (name === CurrentBank){
        var keys = Object.keys(Banks);
        if (keys.length > 1){
          CurrentBank = (keys[0] !== name) ? keys[0] : keys[1];
        } else {
          CurrentBank = "";
        }
      }
      Banks[name].el.parentNode.removeChild(Banks[name].el);
      delete Banks[name];
      if (CurrentBank !== ""){
        // TODO: Activate new Bank.
      }
    }
    return this;
  }

  renameBank(name, newname){
    if ((name in Banks) && !(newname in Banks)){
      Banks[newname] = Banks[name];
      delete Banks[name];
      SetElBankName(Banks[newname].el, newname);
    }
    return this;
  }

  activateBank(name){
    if (CurrentBank !== name && (name in Banks)){
      Banks[name].el.click();
      //CurrentBank = name;
      //GlobalEvents.emit("change_surface", Banks[CurrentBank].bank);
    }
    return this;
  }

  clear(){
    Object.keys(Banks).forEach((item) => {
      item.el.parentNode.removeChild(item.el);
    });
    Banks = {};
    if (CurrentBank !== "")
      GlobalEvents.emit("change_surface", null);
    CurrentBank = ""; 
  }
}


const instance = new CTRLBanksStore();
export default instance;



