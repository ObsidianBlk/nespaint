import {EventCaller} from "/app/js/common/EventCaller.js";
import Utils from "/app/js/common/Utils.js";

// Keycode list based on...
// https://keycode.info/
var KEYBYCODE = {
  3:"break",
  8:"backspace",
  9:"tab",
  13:"enter",
  16:"shift",
  17:"ctrl",
  18:"alt",
  19:"pause",
  20:"capslock",
  27:"esc",
  32:"space",
  33:"pageup",
  34:"pagedown",
  35:"end",
  36:"home",
  37:"left",
  38:"up",
  39:"right",
  40:"down",
  41:"select",
  42:"print",
  43:"execute",
  44:"printscreen",
  45:"insert",
  46:"delete",
  47:"help",
  48:"0",
  49:"1",
  50:"2",
  51:"3",
  52:"4",
  53:"5",
  54:"6",
  55:"7",
  56:"8",
  57:"9",
  65:"a",
  66:"b",
  67:"c",
  68:"d",
  69:"e",
  70:"f",
  71:"g",
  72:"h",
  73:"i",
  74:"j",
  75:"k",
  76:"l",
  77:"m",
  78:"n",
  79:"o",
  80:"p",
  81:"q",
  82:"r",
  83:"s",
  84:"t",
  85:"u",
  86:"v",
  87:"w",
  88:"x",
  89:"y",
  90:"z",
  91:"leftmod", // Window key (left)
  92:"rightwin",// Window key (right)
  93:"rightmod",// Window key (right)
  96:"num0",
  97:"num1",
  98:"num2",
  99:"num3",
  100:"num4",
  101:"num5",
  102:"num6",
  103:"num7",
  104:"num8",
  105:"num9",
  112:"f1",
  113:"f2",
  114:"f3",
  115:"f4",
  116:"f5",
  117:"f6",
  118:"f7",
  119:"f8",
  120:"f9",
  121:"f10",
  122:"f11",
  123:"f12",
  144:"numlock",
  145:"scrolllock",
};


var KEYBYNAME = (function(){
  var keys = Object.keys(KEYBYCODE);
  var o = {};
  for (var i=0; i < keys.length; i++){
    if (KEYBYCODE.hasOwnProperty(keys[i])){
      o[KEYBYCODE[keys[i]]] = keys[i];
    }
  }
  return o;
})();

var KEYTYPE = {
  "number":[48,49,50,51,52,53,54,55,56,57,96,97,98,99,100,101,102,103,104,105],
  "letter":[65,66,67,68,69,70,71,72,73,74,75,76,77,78,79,80,81,82,83,84,85,86,87,88,89,90],
  "mod":[16,17,18],
  "arrow":[37,38,39,40],
  "wasd":[87,65,83,68],
  "fn":[112,113,114,115,116,117,118,119,120,121,122,123],
  "n1":[48,96],
  "n2":[49,97],
  "n3":[50,98],
  "n4":[51,99],
  "n5":[52,100],
  "n6":[53,101],
  "n7":[54,102],
  "n8":[55,103],
  "n9":[56,104],
  "n0":[57,105]
};


var KEYMAP = {
  "lastcode":null,
  "lastaction":"",
  "currentcodes":[]
};

// TODO: Reeval this idea.
const KEYPRESS_DELAY = 350; // Time in milliseconds. NOTE: May make this a variable in future.
const MOUSECLICK_DELAY = 350; // Time in milliseconds.

function AssignCodeName(code, name){
  name = name.toLowerCase();
  var remove = (code in Object.keys(KEYBYCODE));

  if (name in Object.keys(KEYBYNAME)){
    if (remove && KEYBYCODE[code] === name){
      return; // We're being asked to replace the exact same thing. SKIP!
    }
    throw new ValueError("Key name '" + name + "' already assigned. Cannot use duplicate key names.");
  }
  if (remove){
    delete KEYBYNAME[KEYBYCODE[code]];
  }
  KEYBYCODE[code] = name;
  KEYBYNAME[name] = code;
}


function KeymapContains(code){
  return KEYMAP["currentcodes"].findIndex(c=>c[0] == code) >= 0;
}


function AddToKeymap(code, action){
  KEYMAP["lastcode"] = code;
  KEYMAP["lastaction"] = action;
  if (KeymapContains(code) == false){
    KEYMAP["currentcodes"].push([code, Math.floor(Date.now())]);
    if (KEYMAP["currentcodes"].length > 1){
      KEYMAP["currentcodes"].sort(function(a, b){return a[0] - b[0];});
    }
    return true;
  }
  return false;
}

function RemoveFromKeymap(code, action){
  KEYMAP["lastcode"] = code;
  KEYMAP["lastaction"] = action;
  var ctime = Math.floor(Date.now());
  for (var i=0; i < KEYMAP["currentcodes"].length; i++){
    if (KEYMAP["currentcodes"][i][0] === code){
      var timediff = ctime - KEYMAP["currentcodes"][i][1];
      KEYMAP["currentcodes"].splice(i, 1);
      return timediff;
    }
  }
  return -1;
}

function KeyNameToCode(key){
  return (key in Object.keys(KEYBYNAME)) ? KEYBYNAME[key] : -1;
}

function CodeToKeyName(code){
  return (code in Object.keys(KEYBYCODE)) ? KEYBYCODE[code] : "" + code;
}

function CodesToEventName(codes){
  var ename = "";
  for (var i=0; i < codes.length; i++){
    ename += ((ename !== "") ? "+" : "") + CodeToKeyName(codes[i]);
  }
  return ename;
}

function KeymapEventName(){
  return CodesToEventName(KEYMAP["currentcodes"].map(e=>e[0]));
}


function ReorderEventName(ename){
  // This function takes a keyboard event name and reorders it into key-code order.
  // This way users can write the event any way they want, but should still result in proper
  // event being called.
  var elist = ename.split("+");
  var ecodes = [];
  for (var i=0; i < elist.length; i++){
    var key = elist[i].trim().toLowerCase();
    if (!(key in Object.keys(KEYBYNAME))){
      if (!Number.isNaN(key))
        ecodes.push(parseInt(key));
      else
        return ""; // This event name does not include valid key name!
    } else {
      ecodes.push(KEYBYNAME[key]);
    }
  }
  if (ecodes.length > 0){
    ecodes.sort(function(a, b){return a-b;});
    return CodesToEventName(ecodes);
  }
  return "";
}


export default class Input{
  constructor(){
    this.__emitter = new EventCaller();
    this.__preventDefaults = false;
    // Internet Explorer... that fudged up p.o.s. has to make mouse button detection difficult
    // with different button values from ALL other browsers. So... if Input has this value set to
    // true, then mouseup and mousedown events will base it's detection of IE button values, instead
    // of the real values.
    this.__ieMouseMode = false;
    // If set, this is the element that the mouse will focus on and adjust it's position against.
    this.__mouseTarget = null;
    this.__mousePosition = null;
    this.__mouseLastButton = -1;
    this.__mouseLastButtonAction = "";
    this.__mouseButtons = [];

    this.enableKeyboardInput = (function(){
      var handle_keydown = (function(e){
        if (AddToKeymap(e.keyCode, "keydown")){
          var ename = KeymapEventName();
          var edata = {
            source: this,
            iscombo: (ename.indexOf("+") >= 0),
            keys: ename,
            keycode:e.keyCode,
            keyname:CodeToKeyName(e.keyCode),
            action:"keydown"
          }
          this.__emitter.emit(ename, edata);
          this.__emitter.emit("keydown", edata);
        }
      }).bind(this);

      var handle_keyup = (function(e){
        var timediff = RemoveFromKeymap(e.keyCode, "keyup");
        if (timediff < 0){
          console.log("WARNING: Failed to find keycode '" + e.keyCode + "' in the Key Map.");
        } else {
          var ename = KeymapEventName();
          var edata = {
            source: this,
            iscombo: (ename.indexOf("+") >= 0),
            keys: ename,
            keycode: e.keyCode,
            keyname: CodeToKeyName(e.keyCode),
            action:"keyup"
          }
          if (timediff <= KEYPRESS_DELAY && KEYMAP["currentcodes"].length <= 0){
            this.__emitter.emit("keypress", edata);
          }
          this.__emitter.emit("keyup", edata);
        }
      }).bind(this);

      return (function(enable){
        enable = (enable !== false);
        if (enable){
          window.addEventListener("keydown", handle_keydown, false);
          //window.addEventListener("keypress", handle_keypress, false);
          window.addEventListener("keyup", handle_keyup, false);
        } else {
          window.removeEventListener("keydown", handle_keydown);
          window.removeEventListener("keyup", handle_keyup);
        }
      }).bind(this);
    }).apply(this);

    this.enableMouseInput = (function(){
      var mousePosition = (function(e){
        var pos = {
          lastX: (this.__mousePosition !== null) ? this.__mousePosition.x : null,
          lastY: (this.__mousePosition !== null) ? this.__mousePosition.y : null,
          x: e.clientX,
          y: e.clientY,
          inbounds: true
        }
        if (this.__mouseTarget !== null){
          var rect = this.__mouseTarget.getBoundingClientRect();
          pos.x -= rect.left;
          pos.y -= rect.top;
          pos.inbounds = (pos.x >= 0 && pos.x < rect.right && pos.y >= 0 && pos.y < rect.bottom);
        }
        return pos;
      }).bind(this);

      var buttonID = (function(e){
        var btn = e.button;
        if ((this.__ieMouseMode && btn === 1) || (!this.__ieMouseMode && btn === 0)){
          btn = 0;
        } else if ((this.__ieMouseMode && e.button === 4) || (!this.__ieMouseMode && e.button === 1)){
          btn = 1;
        }
        return btn;
      }).bind(this);

      var addMouseButton = (function(btn){
        if (this.__mouseButtons.findIndex(b=>b[0]===btn) < 0){
          this.__mouseButtons.push([btn, Math.floor(Date.now())]);
          return true;
        }
        return false;
      }).bind(this);

      var removeMouseButton = (function(btn){
        var idx = this.__mouseButtons.findIndex(b=>b[0]===btn);
        var diff = -1;
        if (idx >= 0){
          diff = Math.floor(Date.now()) - this.__mouseButtons[idx][1];
          this.__mouseButtons.splice(idx, 1);
        }
        return diff;
      }).bind(this);

      var handle_mousemove = (function(e){
        if (this.__preventDefaults)
          e.preventDefault();
        var pos = mousePosition(e);
        if (pos.inbounds){
          this.__mousePosition = pos;
          this.__emitter.emit("mousemove", {
            source: this,
            lastX: pos.lastX,
            lastY: pos.lastY,
            x: pos.x,
            y: pos.y,
            button: this.__mouseLastButton,
            action: "mousemove"
          });
        }
      }).bind(this);

      var handle_mousedown = (function(e){ 
        var button = buttonID(e);
        var pos = mousePosition(e);
        if (pos.inbounds){
          if (this.__preventDefaults)
            e.preventDefault();
          if (addMouseButton(button)){
            this.__mousePosition = pos;
            this.__mouseLastButton = button;
            this.__mouseLastButtonAction = "mousedown";
            this.__emitter.emit("mousedown", {
              source: this,
              lastX: pos.lastX,
              lastY: pos.lastY,
              x: pos.x,
              y: pos.y,
              button: button,
              action: "mousedown"
            });
          }
        }
      }).bind(this);

      var handle_mouseup = (function(e){
        if (this.__preventDefaults)
          e.preventDefault();
        var button = buttonID(e);
        var pos = mousePosition(e);
        // NOTE: I still want to check for button removal, even before testing if an event should
        // fire, so that I don't have any phantom buttons listed as "pressed" in the mouseButtons list.
        var diff = removeMouseButton(button);
        if (pos.inbounds && diff >= 0){
          this.__mousePosition = pos;
          this.__mouseLastButton = button;
          this.__mouseLastButtonAction = "mouseup";
          this.__emitter.emit("mouseup", {
            source: this,
            lastX: pos.lastX,
            lastY: pos.lastY,
            x: pos.x,
            y: pos.y,
            button: button,
            action: "mouseup"
          });
        }
      }).bind(this);

      var handle_mousewheel = (function(e){
        if (this.__preventDefaults)
          e.preventDefault();
        // TODO: Finish me!
      }).bind(this);

      return (function(enable){
        enable = (enable !== false);
        if (enable){
          window.addEventListener("mousemove", handle_mousemove);
          window.addEventListener("mousedown", handle_mousedown);
          window.addEventListener("mouseup", handle_mouseup);
          window.addEventListener("mousewheel", handle_mousewheel);
        } else {
          window.removeEventListener("mousemove", handle_mousemove);
          window.removeEventListener("mousedown", handle_mousedown);
          window.removeEventListener("mouseup", handle_mouseup);
          window.removeEventListener("mousewheel", handle_mousewheel);
        }
      }).bind(this);
    }).apply(this);

    this.enableKeyboardInput();
    this.enableMouseInput();
  }

  get lastkey(){
    if (KEYMAP["lastcode"] !== null){
      if (KEYMAP["lastcode"] in Object.keys(KEYBYCODE)){
        return KEYBYCODE[KEYMAP["lastcode"]];
      }
      return "" + KEYMAP["lastcode"];
    }
    return "0";
  }

  get lastaction(){
    return KEYMAP["lastaction"];
  }

  get currentKeys(){
    return KeymapEventName();
  }

  get currentCodes(){
    return KEYMAP["currentcodes"].map(e=>e[0]);
  }

  get preventDefaults(){return this.__preventDefaults;}
  set preventDefaults(p){
    this.__preventDefaults = (p === true);
  }

  get ieMouseMode(){return this.__ieMouseMode;}
  set ieMouseMode(m){this.__ieMouseMode = (m === true);}

  get mouseTargetElement(){return this.__mouseTarget;}
  set mouseTargetElement(el){
    if (el === null || Utils.isElement(el)){
      this.__mouseTarget = el;
    } else {
      throw new TypeError("Expected Mouse Target Element to be null or an HTMLElement object.");
    }
  }

  isKeyDown(key){
    if (typeof(key) === 'string'){
      key = KeyNameToCode(key);
    }
    for (var i=0; i < KEYMAP["currentcodes"].length; i++){
      if (KEYMAP["currentcodes"][i][0] === key){
        return true;
      }
    }
    return false;
  }

  listen(ename, func, owner=null, once=false){
    if ((["keyup", "keydown", "keypress", "mousemove", "mousedown", "mouseup"]).indexOf(ename) >= 0){
      this.__emitter.listen(ename, func, owner, once);
    } else {
      ename = ReorderEventName(ename);
      if (ename === ""){
        throw new ValueError("Failed to parse key or key combination.");
      }
      this.__emitter.listen(ename, func, owner, once);
    }
    return this;
  }

  unlisten(ename, func, owner=null){
    if ((["keyup", "keydown", "keypress", "mousemove", "mousedown", "mouseup"]).indexOf(ename) >= 0){
      this.__emitter.unlisten(ename, func, owner);
    } else {
      ename = ReorderEventName(ename);
      if (ename !== "")
        this.__emitter.unlisten(ename, func, owner);
    }
    return this;
  }
}



