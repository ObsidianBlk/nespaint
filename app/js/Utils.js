const utils = {
  debounce:function(func, delay){
    var timeout = null;
    return function(){
      var context = this;
      var args = arguments;
      clearTimeout(timeout);
      timeout = setTimeout(function(){
        func.apply(context, args);
      }, delay);
    };
  }
};


Object.freeze(utils);
export default utils;

