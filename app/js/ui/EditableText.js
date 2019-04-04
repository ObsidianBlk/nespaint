import Utils from "/app/js/common/Utils.js";
import {EventCaller} from "/app/js/common/EventCaller.js";


export default class EditableText extends EventCaller{
  constructor(srcel, clsname){
    super();
    this.__spanEl = null;
    this.__inputEl = null;

    var els = srcel.querySelectorAll("." + clsname);
    for (let i=0; i < els.length; i++){
      if (els[i].nodeName === "SPAN")
        this.__spanEl = els[i];
      else if (els[i].nodeName === "INPUT")
        this.__inputEl = els[i];
    }

    if (this.__spanEl === null || this.__inputEl === null)
      throw new Error("Missing required SPAN and INPUT elements.");

    var self = this;
    this.__inputEl.addEventListener("blur", function(){
      if (!this.classList.contains("hidden")){
        self.__spanEl.innerHTML = this.value;
        this.classList.add("hidden");
        self.__spanEl.classList.remove("hidden");
        self.emit("value_change", this.value);
      }
    });

    this.__spanEl.addEventListener("click", function(){
      if (!this.classList.contains("hidden")){
        self.__inputEl.value = this.innerHTML;
        this.classList.add("hidden");
        self.__inputEl.classList.remove("hidden");
      }
    });

    if (this.__spanEl.classList.contains("hidden") && this.__inputEl.classList.contains("hidden")){
      this.__spanEl.classList.remove("hidden");
    } else if (!this.__spanEl.classList.contains("hidden") && !this.__inputEl.classList.contains("hidden")){
      this.__inputEl.classList.add("hidden");
    }
  }

  get value(){
    if (this.__spanEl.classList.contains("hidden")){
      return this.__inputEl.value;
    } else {
      return this.__spanEl.innerHTML;
    }
  }

  set value(v){
    this.__inputEl.value = v;
    this.__spanEl.innerHTML = v;
    this.emit("value_change", v);
  }
}





