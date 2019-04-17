import GlobalEvents from "/app/js/common/EventCaller.js";
import Utils from "/app/js/common/Utils.js";
import Input from "/app/js/ui/Input.js";

class Modal{
  constructor(){
    this.__currentModalEl = null;

    window.addEventListener("click", (function(event){
      if (event.target === this.__currentModalEl){
        this.close_modal();
      }
    }).bind(this));

    GlobalEvents.listen("modal-open", (function(target, event){
      var force = (event.hasOwnProperty("force")) ? event.force === true : false;
      if (event.hasOwnProperty("id") && typeof(event.id) === 'string'){ 
        this.open_modal_id(event.id, force);
      } else if (event.hasOwnProperty("cls") && typeof(event.cls) === 'string'){
        this.open_modal_class(event.cls, force);
      }
    }).bind(this));

    GlobalEvents.listen("modal-close", (function(target, event){
      this.close_modal();
    }).bind(this));

    // TODO: Deprecate this mechanic. Let other controllers directly handle input.
    GlobalEvents.listen("modal-submit", (function(target, event){
      if (!event.hasOwnProperty("subevent"))
        return;
      var ename = event.subevent;
      var vals = {};
      if (event.hasOwnProperty("ids")){
        var ids = event.ids.split(",");
        var cel = this.__currentModalEl;
        ids.forEach((item) => {
          var id = item.trim();
          var el = cel.querySelector("[name='" + id + "']");
          if (el) // TODO: Check if el is an INPUT node and switch between the node types.
            vals[id] = el.value;
        });
      }
      GlobalEvents.emit(ename, vals);
      if (event.hasOwnProperty("closeoncomplete"))
        this.close_modal();
    }).bind(this));
  }

  get currentModalElement(){
    return this.__currentModalEl;
  }

  open_modal_id(idname, force=false){
    var el = document.getElementById(idname);
    /*if (el.classList.contains("modal") && this.__currentModalEl !== el){
      if (this.__currentModalEl !== null && force)
        this.close_modal();
      if (this.__currentModalEl === null){
        if (el){
          return this.open_modal_element(el);
        }
      }
    }*/
    return (el) ? this.open_modal_element(el, force) : this;
  }

  open_modal_class(clsname, force=false){
    var el = document.querySelector((clsname.indexOf(".") < 0) ? "." + clsname : clsname);
    return (el) ? this.open_modal_element(el, force) : this;
  }

  open_modal_element(el, force=false){
    if (Utils.isElement(el)){
      if (el.classList.contains("modal") && this.__currentModalEl !== el){
        if (this.__currentModalEl !== null && force)
          this.close_modal();
        if (this.__currentModalEl === null){
          el.classList.add("modal-visible");
          this.__currentModalEl = el;
        }
      }
    }
    return this;
  }

  close_modal(){
    if (this.__currentModalEl !== null){
      this.__currentModalEl.classList.remove("modal-visible");
      this.__currentModalEl = null;
    }
    return this;
  }
}


const instance = new Modal();
export default instance;
