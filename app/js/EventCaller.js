
/**
 *  Event caller/listener system. Intended to be extended by classes which require
 *  an event callback system.
 */
export class EventCaller{
  constructor(){
    this.__listeners = {};
  }

  /**
   *  @type {number}
   */
  get totalListeners(){
    var count = 0;
    for (key in Object.keys(this.__listeners)){
      count += this.__listeners[key].length
    }
    return count;
  }

  /**
   *  @type {Array[string]}
   */
  get watchedEvents(){
    return Object.keys(this.__listeners);
  }

  /**
   *  Returns true if the given callback is listening for the given event, and false otherwise.
   *  @param {string} eventName - The name of the event to check.
   *  @param {Function} callback - The function/method to check for
   *  @param {Object} [owner=null] - The object to use as "this" when calling the callback function.
   *  @returns {bool}
   */
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

  /**
   *  Sets the given callback to listen for the given event.
   *  If [once] is true, the callback will be cleared from the listeners list after the named
   *  event has been emitted.
   *  @param {string} eventName - The name of the event to listen for.
   *  @param {Function} callback - The function to call when the given event is emitted.
   *  @param {Object} [owner=null] - The owner to use when calling the callback.
   *  @param {bool} [once=false] - If true, the callback will be cleared after the next emit of the given event.
   *  @returns {this}
   */
  listen(eventName, callback, owner=null, once=false){
    if (typeof(callback) !== 'function')
      throw new TypeError("Expected callback argument to be a function or class method.");
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

  /**
   *  Removes the given callback from the given event.
   *  NOTE: If the listener callback was set with it's owner, that owner must be included
   *  to remove the listener callback successfully.
   *  @param {string} eventName - The name of the event to remove from.
   *  @param {Function} callback - The function/method to remove.
   *  @param {Object} [owner=null] - The owner of the callback.
   *  @returns {this}
   */
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

  /**
   *  Removes all listeners from the given event.
   *  @param {string} eventName - The name of the event to clear listeners from.
   *  @returns {this}
   */
  unlisten_event(eventName){
    if (typeof(eventName) !== 'string')
      throw new TypeError("Expected eventName to be string.");
    if (eventName.length <= 0)
      throw new ValueError("Argument eventName cannot be a zero-length string.");
    if (this.__listener.hasOwnProperty(eventName))
      delete this.__listener[eventName];
    return this;
  }

  /**
   *  Removes all listeners.
   *  @returns {this}
   */
  unlisten_all(){
    // NOTE: Perhaps it's better to loop through and delete each property? This should do for now though.
    this.__listeners = {};
    return this;
  }


  /**
   *  Returns the count of listeners attached to the given event.
   *  @param {string} eventName - The name of the event to get the count of.
   *  @returns {number}
   */
  event_listener_count(eventName){
    if (typeof(eventName) !== 'string')
      throw new TypeError("Expected eventName to be string.");
    if (eventName.length <= 0)
      throw new ValueError("Argument eventName cannot be a zero-length string.");
    if (this.__listener.hasOwnProperty(eventName)){
      return this.__listener[eventName].length;
    }
    return 0;
  }


  /**
   *  Emits the given event, calling all listener callbacks attached to the event and passing each
   *  the arguments (if any) given.
   *  NOTE: All listeners of the given event designated to only listen once will be removed after
   *  this call.
   *  @param {string} eventName - The name of the event to emit.
   *  @param {...*} args - The arguments to pass to every listener of this event.
   *  @returns {this}
   */
  emit(){
    var args = Array.from(arguments);
    if (args.length <= 0)
      throw new Error("Missing required eventName argument.");
    var eventName = args[0];
    args = args.slice(1);

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


const GlobalEvent = new EventCaller();
export default GlobalEvent;




