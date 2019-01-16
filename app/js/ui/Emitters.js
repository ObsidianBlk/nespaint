import GlobalEvents from "/app/js/EventCaller.js";


function handle_emitter(event){
  var el = event.target;
  if (el){
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
          console.log("Failed to emit '" + args[0] + "'. Attribute 'emit-args' contains malformed JSON.");
        }
      }
      GlobalEvents.emit.apply(GlobalEvents, args);
    }
  }
}



export default {
  initialize: function(){
    var elist = document.querySelectorAll("[emit]");
    elist.forEach(function(el){
      el.addEventListener("click", handle_emitter);
    });
  },

  initialize_element: function(el){
    if (el.hasAttribute("emit")){
      el.addEventListener("click", handle_emitter);
    }
  }
}






