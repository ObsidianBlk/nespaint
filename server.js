const package = require("./package.json");

const exec = require('child_process').execSync;

const fs = require("fs");
const path = require("path");
const express = require("express");
const app = express();

const http = require("http");
const https = require("https");

var production = process.env.PRODUCTION || false;
var port = process.env.NESPORT || 80;
var portSSL = process.env.NESPORTSSL || 443;
var sslKeyPath = process.env.SSLKEYPATH || null;
var sslCertPath = process.env.SSLCERTPATH || null;
var sslCaPath = process.env.SSLCAPATH || null;

function GenVersion(){
  var v = package.version;
  // Testing for a GIT repo... if not in a production environment.
  if (production === false){
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


console.log("NESPaint (v" + version + ") Server");

if (sslKeyPath !== null && sslCertPath !== null){
  try {
    var options = {
      key: fs.readFileSync(sslKeyPath),
      cert: fs.readFileSync(sslCertPath)
    }
    if (sslCaPath !== null)
      options.ca = fs.readFileSync(sslCaPath);

    app.use(function(req, res, next){
      if (req.secure){
        next();
      } else {
        res.redirect('https://' + req.headers.host + req.url);
      }
    });
    
    https.createServer(options, app).listen(portSSL, () => {
      console.log("HTTPS Listening on port " + portSSL + "!");
    });
  } catch (e) {
    console.log("WARNING: Failed to initialize HTTPS server. \"" + e.toString() + "\"");
  } 
}

http.createServer(app).listen(port, () => {
  console.log("HTTP Listening on port " + port + "!");
});







