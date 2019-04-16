


var SCHEMA_LIST = [];
var DIRTY = false;
var CUR_AJV = null;

export default Object.freeze({
  add:function(s){
    if (!("$id" in s))
      throw new Error("Missing '$id' property in schema.");
    for (let i=0; i < SCHEMA_LIST.length; i++){
      if (SCHEMA_LIST[i]["$id"] === s["$id"])
        throw new Error("Schema already exists with $id '" + s["$id"] + "'.");
    }
    SCHEMA_LIST.push(s);
    DIRTY = true;
  },

  remove:function(id){
    var idx = SCHEMA_LIST.findIndex((item) => {
      return item["$id"] === id;
    });
    if (idx >= 0){
      SCHEMA_LIST.splice(idx, 1);
      DIRTY = true;
    }
  },

  has:function(id){
    return SCHEMA_LIST.findIndex((item) => {
      return item["$id"] === id;
    }) >= 0;
  },

  getValidator:function(id){
    if (DIRTY){
      DIRTY = false;
      if (SCHEMA_LIST.length <= 0){
        CUR_AJV = null;
      } else {
        CUR_AJV = new Ajv({schema:SCHEMA_LIST});
      }
    }
    return (CUR_AJV !== null) ? CUR_AJV.getSchema(id) : null;
  }
});



