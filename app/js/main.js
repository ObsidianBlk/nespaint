import Utils from "/app/js/common/Utils.js";
import GlobalEvents from "/app/js/common/EventCaller.js";
import EmitterElements from "/app/js/ui/Emitters.js";
import Input from "/app/js/ui/Input.js";
import Modal from "/app/js/ui/Modal.js";
import Tabs from "/app/js/ui/Tabs.js";
import CTRLPalettes from "/app/js/ctrls/CTRLPalettes.js";
import CTRLPainter from "/app/js/ctrls/CTRLPainter.js";
import CTRLBankTools from "/app/js/ctrls/CTRLBankTools.js";
import CTRLNametableTools from "/app/js/ctrls/CTRLNametableTools.js";
import CTRLIO from "/app/js/ctrls/CTRLIO.js";

import NESPalette from "/app/js/models/NESPalette.js";

function TitlePainter(pal){
  var elist = document.querySelectorAll(".color-NES-random");
  if (elist){
    elist.forEach(function(el){
      var ca = Math.floor(Math.random() * 11) + 1;
      var cb = Math.floor(Math.random() * 3);
      var index = (cb*16)+ca;
      el.style.color = pal[index];
      //el.style["background-color"] = "#000";
    });
  }
}

function initialize(DOC){
  // UI and View only controllers
  TitlePainter(NESPalette.SystemColor);
  EmitterElements.initialize();
  Tabs.initialize();
  
  // Controllers explicitly interface model data to view.
  CTRLPainter.initialize();
  CTRLBankTools.initialize();
  CTRLNametableTools.initialize();

  CTRLIO.initialize();

  var cover = document.querySelector(".cover");
  Utils.addListenerToEvents(
    cover,
    [
      "webkitAnimationEnd",
      "oanimationend",
      "oAnimationEnd",
      "msAnimationEnd",
      "animationend"
    ],
    function(){
      this.parentNode.removeChild(this);
    });
  if (cover){
    cover.classList.add("coverFadeout");
  }
}


initialize(document);
