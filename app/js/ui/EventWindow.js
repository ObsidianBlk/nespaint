import '/app/js/EventCaller.js'

/**
 *  Wraps the browser's window object around the EventCaller allowing the user to connect to system events
 *  by listening for those events (ex: "onclick", "onresize", etc).
 *
 *  Users should not directly set the window event handler functions if using this class.
 */
export class EventWindow extends EventCaller{
  constructor(){
    super();
  }

  listen(eventName, callback, owner=null, once=false){
    if (window.hasOwnProperty(eventName)){
      if (window[eventName] === null || typeof(window[eventName]) === 'undefined'){
        window[eventName] = (function(event){
          this.emit(eventName, event);
        }).bind(this);
      }
      super.listen(eventName, callback, owner, once);
      return this;
    }
    throw new ValueError("Window object has no event named '" + eventName +"'.");
  }

  unlisten(eventName, callback, owner=null){
    if (window.hasOwnProperty(eventName)){
      super.unlisten(eventName, callback, owner);
      if (super.event_listener_count(eventName) == 0){
        window[eventName] = undefined;
      }
    }
    return this;
  }

  unlisten_event(eventName){
    if (window.hasOwnProperty(eventName)){
      super.unlisten_event(eventName);
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
