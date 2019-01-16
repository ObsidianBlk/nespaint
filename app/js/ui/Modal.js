import EventWindow from "/app/js/ui/EventWindow.js";


class Modal{
  constructor(){
    this.__currentModalEl = null;
    this.__initialized = false;

    EventWindow.listen("onclick", (function(event){
      if (event.target === this.__currentModalEl){
        this.close_modal();
      }
    }).bind(this));
  }

  get currentModalElement(){
    return this.__currentModalEl;
  }

  open_modal_by_id(idname){
    if (this.__initialized === true && this.__currentModalEl === null){
      var el = document.getElementById(idname);
      if (el){
        return this.open_modal_element(el);
      }
    }
    return this;
  }

  open_modal_element(el){
    if (this.__initialized === true, this.__currentModalEl === null && el.classList.contains("modal")){
      el.classList.add("modal-visible");
      this.__currentModalEl = el;
    }
    return this;
  }

  close_modal(){
    if (this.__currentModalEl !== null){
      this.__currentModalEl.classList.remove("modal-visible");
    }
    return this;
  }

  initialize_btn_element(el){
    if (this.__initialized === true){
      if (el.hasAttribute("data-modal-open")){

      } else if (el.hasAttribute("data-modal-close")){

      } else if (el.hasAttribute("data-modal-toggle")){

      }
    }
    return this;
  }

  initialize(){
    ;
  }
}


const instance = new Modal();
Object.freeze(instance);
export default instance;
