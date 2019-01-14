

export class EventCaller{
  constructor(){
    this.__listeners = {};
  }

  get totalListeners(){
    var count = 0;
    for (key in Object.keys(this.__listeners)){
      count += this.__listeners[key].length
    }
    return count;
  }

  is_listening(eventName, callback, owner=null){
    if (typeof(eventName) !== 'string')
      throw new TypeError("Expected eventName to be string.");
    if (eventName.length <= 0)
      throw new ValueError("Argument eventName cannot be a zero-length string.");

    if (this.__listeners.hasOwnProperty(eventName)){
      if (typeof(callback) !== 'function')
        throw new TypeError("Expected callback argument to be a function or class method.");
      for (var i=0; i < this.__listeners[eventName].length; i++){
        if (this.__listeners[eventName][i][0] === callback && 
          this.__listeners[eventName][i][1] === owner){
          return true;
        }
      }
    }
    return false;
  }

  listen(eventName, callback, owner=null, once=false){
    try{
      if (!this.is_listening(eventName, callback, owner)){
        if (!this.__listeners.hasOwnProperty(eventName)){
          this.__listeners[eventName] = [];
        }
        this.__listeners[eventName].push([callback, owner, once]);
      }
    } catch (e) {
      throw e;
    }
    return this;
  }

  unlisten(eventName, callback, owner=null){
    if (typeof(eventName) !== 'string')
      throw new TypeError("Expected eventName to be string.");
    if (eventName.length <= 0)
      throw new ValueError("Argument eventName cannot be a zero-length string.");

    if (this.__listeners.hasOwnProperty(eventName)){
      if (typeof(callback) !== 'function')
        throw new TypeError("Expected callback argument to be a function or class method.");
      for (var i=0; i < this.__listeners[eventName].length; i++){
        if (this.__listeners[eventName][i][0] === callback && 
          this.__listeners[eventName][i][1] === owner){
          this.__listeners[eventName].splice(i, 1);
          if (this.__listeners[eventName].length <= 0)
            delete this.__listeners[eventName];
          break;
        }
      }
    }
    return this;
  }

  unlisten_event(eventName){
    if (typeof(eventName) !== 'string')
      throw new TypeError("Expected eventName to be string.");
    if (eventName.length <= 0)
      throw new ValueError("Argument eventName cannot be a zero-length string.");
    if (this.__listener.hasOwnProperty(eventName))
      delete this.__listener[eventName];
    return this;
  }

  unlisten_all(){
    // NOTE: Perhaps it's better to loop through and delete each property? This should do for now though.
    this.__listeners = {};
  }

  emit(eventName, args=null){
    if (typeof(eventName) !== 'string')
      throw new TypeError("Expected eventName to be string.");
    if (eventName.length <= 0)
      throw new ValueError("Argument eventName cannot be a zero-length string.");

    var once = [];
    if (this.__listeners.hasOwnProperty(eventName)){
      for (var i=0; i < this.__listeners[eventName].length; i++){
        var cb = this.__listeners[eventName][i][0];
        var own = this.__listeners[eventName][i][1];
        if (this.__listeners[eventName][i][2] === true)
          once.push([cb, own]);
        cb.apply(own, args);
      }

      if (once.length > 0){
        for (var i=0; i < once.length; i++){
          this.unlisten(eventName, once[i][0], once[i][1]);
        }
      }
    }

    return this;
  }
}







