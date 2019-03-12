import GlobalEvents from "/app/js/common/EventCaller.js";


function UnselectTab(tabname, tabid, el){
  el.classList.remove("tab-selected");
  var d = document.querySelectorAll("[fortabs='" + tabname + "'][tabid='" + tabid + "']");
  for (let i=0; i < d.length; i++){
    d[i].classList.add("hidden");
  }
}

function SelectTab(tabname, tabid, el){
  if (!el.classList.contains("tab-selected"))
    el.classList.add("tab-selected");
  var d = document.querySelectorAll("[fortabs='" + tabname + "'][tabid='" + tabid + "']");
  for (let i=0; i < d.length; i++){
    d[i].classList.remove("hidden");
  }
}

function GenTABListener(tabname, tabid, lil){
  return function(e){
    for (let i=0; i < lil.length; i++){
      if (lil[i].classList.contains("tab-selected")){
        if (lil[i].getAttribute("tabid") !== tabid){
          UnselectTab(tabname, lil[i].getAttribute("tabid"), lil[i]);
        } else {break; /* The same tab is being selected. */}
      } else if (lil[i].getAttribute("tabid") === tabid){
        SelectTab(tabname, tabid, lil[i]);
      }
    }
  }
}


function HideAllTABContent(tabname){
  var d = document.querySelectorAll("[fortabs='" + tabname + "']");
  for (let i=0; i < d.length; i++){
    d[i].classList.add("hidden");
  }
}

class Tabs{
  constructor(){}

  initialize(){
    var tabs = document.querySelectorAll("ul[tabs]");
    for (let i=0; i < tabs.length; i++){
      var selectionMade = false;
      var tabname = tabs[i].getAttribute("tabs");
      HideAllTABContent(tabname);
      var li = tabs[i].querySelectorAll("li[tabid]");
      for (let j=0; j < li.length; j++){
        var tabid = li[j].getAttribute("tabid");
        var a = li[j].querySelector("a");
        a.addEventListener("click", GenTABListener(tabname, tabid, li));
        if (li[j].classList.contains("tab-selected")){
          if (selectionMade){
            UnselectTab(tabname, tabid, li[j]);
          } else {
            SelectTab(tabname, tabid, li[j]);
            selectionMade = true;
          }
        }
      }
      if (selectionMade == false){
        var tabid = li[0].getAttribute("tabid");
        SelectTab(tabname, tabid, li[0]);
      }
    }
  }
}


const instance = new Tabs();
export default instance;

