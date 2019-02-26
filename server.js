const fs = require("fs");
const path = require("path");
const express = require("express");
const app = express();
var port = 8000;

app.use("/app", express.static(path.join(__dirname, "/app")));
app.get('/', function(req, res){
  res.sendFile(path.join(__dirname, "/index.html"));
});

app.listen(port, () => console.log("NESPaint listening on port ${port}!"));
