const utils = {
  isInt:function(v){
    if (isNaN(v)){
      return false;
    }
    var x = parseFloat(v);
    return (x | 0) === x;
  },

  isElement:function(el){
    // Code based on...
    // https://stackoverflow.com/questions/384286/javascript-isdom-how-do-you-check-if-a-javascript-object-is-a-dom-object
    try {
      // Using W3 DOM2 (works for FF, Opera and Chrome)
      return el instanceof HTMLElement;
    } catch(e) {
      // Browsers not supporting W3 DOM2 don't have HTMLElement and
      // an exception is thrown and we end up here. Testing some
      // properties that all elements have (works on IE7)
      return (typeof(el) === "object") && 
        (el.nodeType === 1) && 
        (typeof(el.style) === "object") &&
        (typeof(el.ownerDocument) === "object");
      }
  },

  debounce:function(func, delay, scope){
    var timeout = null;
    return function(){
      //var context = this;
      var context = scope || this;
      var args = arguments;
      clearTimeout(timeout);
      timeout = setTimeout(function(){
        func.apply(context, args);
      }, delay);
    };
  },

  throttle:function(func, threshold, scope){
    threshold || (threshold = 250);
    var lst = 0;
    var timer;

    return function(){
      var context = scope || this;
      var args = arguments;

      var now = Date.now();
      if (now < lst + threshold){
        clearTimeout(timer);
        timer = setTimeout(function(){
          lst = now;
          func.apply(context, args);
        }, threshold);
      } else {
        lst = now;
        func.apply(context, args);
      }
    };
  }
};


Object.freeze(utils);
export default utils;

