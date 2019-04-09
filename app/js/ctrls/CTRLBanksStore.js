import GlobalEvents from "/app/js/common/EventCaller.js";
import Utils from "/app/js/common/Utils.js";
import EditableText from "/app/js/ui/EditableText.js";
import Renderer from "/app/js/ui/Renderer.js";
import NESBank from "/app/js/models/NESBank.js";
import NESPalette from "/app/js/models/NESPalette.js";


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
  var et = new EditableText(el, "title");
  et.listen("value_change", (v) => {el.setAttribute("bankname", v);});
  et.value = name;
  return et;
  //var sel = el.querySelector("." + BLI_TITLE);
  //if (sel){
  //  sel.innerHTML = name;
  //}
}


var RenderBankToEl = Utils.throttle(function(el, bank){
  var cnv = el.querySelector("." + BLI_CANVAS);
  var ctx = cnv.getContext("2d");

  Renderer.renderToFit(bank, ctx); 
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
        if (CurrentBank !== ""){
          Banks[CurrentBank].el.classList.remove(BLI_SELECTED);
          CurrentBank = "";
        }
      } else {
        if (Banks.length <= 0 || (CurrentBank !== "" && Banks[CurrentBank].bank !== surf)){
          console.log("WARNING: Bank object being set outside of Bank Store.");
        }
      }
    }
    GlobalEvents.listen("change_surface", HANDLE_ChangeSurface);


    GlobalEvents.listen("bankstore-add", (function(e){
      if (e.hasOwnProperty("bankname")){
        this.createBank(e.bankname);
        this.activateBank(e.bankname);
      }
    }).bind(this));

    GlobalEvents.listen("bankstore-remove", (function(e){
      if (CurrentBank !== "")
        this.removeBank(CurrentBank);
    }).bind(this));
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
          var elname = SetElBankName(el, name);
          Banks[name] = {bank:bank, el:el, elname:elname};

          if (this.length <= 1){
            Banks[name].el.click();
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
        Banks[CurrentBank].el.click();
      } else {
        GlobalEvents.emit("change_surface", null);
      }
    }
    return this;
  }

  renameBank(name, newname){
    if ((name in Banks) && !(newname in Banks)){
      Banks[newname] = Banks[name];
      Banks[newname].elname.value = newname;
      delete Banks[name];
    }
    return this;
  }

  activateBank(name){
    if (CurrentBank !== name && (name in Banks)){
      Banks[name].el.click();
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



