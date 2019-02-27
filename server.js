const package = require("./package.json");

const exec = require('child_process').execSync;

const fs = require("fs");
const path = require("path");
const express = require("express");
const app = express();
var port = 8000;


function GenVersion(){
  var v = package.version;
  // Testing for a GIT repo.
  try{
    var res = exec("git rev-parse --abbrev-ref HEAD").toString();
    v += "-[" + res.trim();

    res = exec("git rev-parse HEAD").toString();
    v += ":" + res.substring(0, 5) + "]";
  } catch(e) {
    if (v !== package.version){
      v += "]"; // If v doesn't match package.version, then assume that the first git call worked.
    }
  }

  return v;
}
var version = GenVersion();

app.set('views', path.join(__dirname, "/views"));
app.engine('html', require('ejs').renderFile);
app.set('view engine', 'html');
app.use("/app", express.static(path.join(__dirname, "/app")));
app.get('/', function(req, res){
  res.render('index.html', {version:version, author:package.author});
});

app.listen(port, () => {
  console.log("NESPaint (v" + version + ") listening on port " + port + "!");
});
