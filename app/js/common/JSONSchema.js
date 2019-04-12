

var NESPaletteSchema = JSON.stringify({
  "$schema": "http://json-schema.org/draft-07/schema#",
  "$id": "NESPaletteSchema.json",
  "type":"array",
  "minItems":25,
  "maxItems":25,
  "items":{
    "type":"number",
    "minimum": 0,
    "exclusiveMaximum": 64
  }
});


var PalettesStoreSchema = JSON.stringify({
  "$schema": "http://json-schema.org/draft-07/schema#",
  "$id": "PalettesStoreSchema.json",
});
