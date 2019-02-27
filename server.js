const fs = require("fs");
const path = require("path");
const express = require("express");
const app = express();
var port = 8000;

app.set('views', path.join(__dirname, "/views"));
app.engine('html', require('ejs').renderFile);
app.set('view engine', 'html');
app.use("/app", express.static(path.join(__dirname, "/app")));
app.get('/', function(req, res){
  res.render('index.html');
});

app.listen(port, () => console.log("NESPaint listening on port " + port + "!"));
