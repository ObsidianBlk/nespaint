import GlobalEvents from "/app/js/common/EventCaller.js";
import Utils from "/app/js/common/Utils.js";
import NESBank from "/app/js/models/NESBank.js";



var Banks = {};
var CurrentBank = "";



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
        var el = null; // This will be the element associated with this Bank. For now, it's a place holder.
        Banks[name] = {bank:bank, el:el};
        //Banks.push([name, bank, el]);

        if (this.length <= 1){
          GlobalEvents.emit("change_surface", bank);
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
      // TODO: Remove Banks[name].el from the DOM.
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
      // TODO: Change the name in Banks[newname].el
    }
    return this;
  }

  activateBank(name){
    if (CurrentBank !== name && (name in Banks)){
      // TODO: Switch the active element object.
      CurrentBank = name;
      GlobalEvents.emit("change_surface", Banks[CurrentBank].bank);
    }
    return this;
  }

  clear(){
    // TODO: Loop through all keys and remove the elements from the DOM.
    Banks = {};
    CurrentBank = "";
  }
}


const instance = new CTRLBanksStore();
export default instance;



