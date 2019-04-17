

var SCHEMA_LIST = [];
var CUR_AJV = new Ajv();

export default Object.freeze({
  add:function(s){
    if (!("$id" in s))
      throw new Error("Missing '$id' property in schema.");
    for (let i=0; i < SCHEMA_LIST.length; i++){
      if (SCHEMA_LIST[i]["$id"] === s["$id"])
        throw new Error("Schema already exists with $id '" + s["$id"] + "'.");
    }
    SCHEMA_LIST.push(s);
    CUR_AJV.addSchema(s);
  },

  remove:function(id){
    var idx = SCHEMA_LIST.findIndex((item) => {
      return item["$id"] === id;
    });
    if (idx >= 0){
      SCHEMA_LIST.splice(idx, 1);
      CUR_AJV.removeSchema(id);
    }
  },

  has:function(id){
    return SCHEMA_LIST.findIndex((item) => {
      return item["$id"] === id;
    }) >= 0;
  },

  getValidator:function(id){
    return (CUR_AJV !== null) ? CUR_AJV.getSchema(id) : null;
  },

  getLastErrors:function(){
    if (CUR_AJV === null || CUR_AJV.errors === null){return null;}
    return CUR_AJV.errors;
  }
});



