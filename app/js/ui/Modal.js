import EventWindow from "/app/js/ui/EventWindow.js";


class Modal{
  constructor(){
    this.__currentModalEl = null;

    EventWindow.listen("onclick", (function(event){
      if (event.target === this.__currentModalEl){
        this.close_modal();
      }
    }).bind(this));

    EventWindow.listen("modal-open", (function(event){
      if (event.hasOwnProperty("id") && typeof(event.id) === 'string'){
        var force = (event.hasOwnProperty("force")) ? event.force === true : false;
        this.open_modal_id(event.id, force);
      }
    }).bind(this));

    EventWindow.listen("modal-close", (function(event){
      this.close_modal();
    }).bind(this));
  }

  get currentModalElement(){
    return this.__currentModalEl;
  }

  open_modal_id(idname, force=false){
    var el = document.getElementById(idname);
    if (el.classList.contains("modal") && this.__currentModalEl !== el){
      if (this.__currentModalEl !== null && force)
        this.close_modal();
      if (this.__currentModalEl === null){
        if (el){
          return this.open_modal_element(el);
        }
      }
    }
    return this;
  }

  open_modal_element(el, force=false){
    if (el.classList.contains("modal")){
      if (this.__currentModalEl !== null && force)
        this.close_modal();
      if (this.__currentModalEl === null){
        el.classList.add("modal-visible");
        this.__currentModalEl = el;
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
