import GlobalEvents from "/app/js/common/EventCaller.js";


function handle_emitter(event){
  if (this.hasAttribute("emit")){
    event.preventDefault();
    var args = [this.getAttribute("emit"), this];
    if (this.hasAttribute("emit-args")){
      try {
        var j = JSON.parse(this.getAttribute("emit-args"));
        if (j instanceof Array){
          args.concat(j);
        } else {
          args.push(j);
        }
      } catch (e) {
        console.log("Failed to emit '" + args[0] +"': " + e.toString());
        //console.log("Failed to emit '" + args[0] + "'. Attribute 'emit-args' contains malformed JSON.");
      }
    }
    GlobalEvents.emit.apply(GlobalEvents, args);
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






