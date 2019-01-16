import {EventCaller} from '/app/js/EventCaller.js'



function handle_emitter(event){
  var el = event.target;
  if (el.hasAttribute("emit")){
    var args = [el.getAttribute("emit")];
    if (el.hasAttribute("emit-args")){
      try {
        var j = JSON.parse(el.getAttribute("emit-args"));
        if (j instanceof Array){
          args.concat(j);
        } else {
          args.push(j);
        }
      } catch (e) {
        console.log("Failed to emit '" + args[0] + "'. Arguments not in valid JSON form.");
        return;
      }
    }
    EventWindow.instance.emit.apply(EventWindow.instance, args);
  }
}


/**
 *  Wraps the browser's window object around the EventCaller allowing the user to connect to system events
 *  by listening for those events (ex: "onclick", "onresize", etc).
 *
 *  Users should not directly set the window event handler functions if using this class.
 */
class EventWindow extends EventCaller{
  constructor(){
    super();
    if (!EventWindow.instance)
      EventWindow.instance = this;
    return EventWindow.instance;
  }

  get emitter_attributes_enabled(){
    return this.is_listening("onclick", handle_emitter);
  }

  enable_emitter_attributes(enable=true){
    if (enable === true){
      this.listen("onclick", handle_emitter);
    } else {
      this.unlisten("onclick", handle_emitter);
    }
  }

  listen(eventName, callback, owner=null, once=false){
    if (window.hasOwnProperty(eventName)){
      if (window[eventName] === null || typeof(window[eventName]) === 'undefined'){
        window[eventName] = (function(event){
          this.emit(eventName, event);
        }).bind(this);
      } 
    }
    super.listen(eventName, callback, owner, once);
    return this;
  }

  unlisten(eventName, callback, owner=null){ 
    super.unlisten(eventName, callback, owner);
    if (window.hasOwnProperty(eventName)){
      if (super.event_listener_count(eventName) == 0){
        window[eventName] = undefined;
      }
    }
    return this;
  }

  unlisten_event(eventName){ 
    super.unlisten_event(eventName);
    if (window.hasOwnProperty(eventName)){
      window[eventName] = undefined;
    }
    return this;
  }

  unlisten_all(){
    var we = this.watchedEvents;
    super.unlisten_all();
    for (var i=0; i < we.length; i++){
      if (window.hasOwnProperty(we[i])){
        window[we[i]] = undefined;
      }
    }
    return this;
  }
}


const instance = new EventWindow();
Object.freeze(instance);
export default instance;

