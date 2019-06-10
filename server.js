const package = require("./package.json");
const vendors = require("./vendors.json");

const exec = require('child_process').execSync;

const fs = require("fs");
const path = require("path");
const express = require("express");
const app = express();

const http = require("http");
const https = require("https");

const sass = require("sass");
const SASS_PATH = path.join(__dirname, "sass");
const SASS_FILE = "style.scss";

const watcher = require("chokidar").watch(SASS_PATH, {ignored: /[\/\\]\./, persistent: true});

// --------------------------------------------------------
// Environment options for the server.
var production = process.env.PRODUCTION || false;
var forceCSSRegen = process.env.FORCECSSREGEN || false;
// NOTE: The default ports are blocked by default on linux without some hocus pocus.
var port = process.env.NESPORT || 80;
var portSSL = process.env.NESPORTSSL || 443;
var sslKeyPath = process.env.SSLKEYPATH || null;
var sslCertPath = process.env.SSLCERTPATH || null;
var sslCaPath = process.env.SSLCAPATH || null;

var css_output = ""; // Used to hold dynamic css.

// -------------------------------------------------------
// Simple helper function
function debounce(func, delay, scope){
  var timeout = null;
  return function(){
    var context = scope || this;
    var args = arguments;
    clearTimeout(timeout);
    timeout = setTimeout(function(){
      func.apply(context, args);
    }, delay);
  };
}

var generateCSS = debounce(function(src, cb){
  sass.render({file: src}, (err, res)=>{
    if (err){
      cb("Failed to generate css - " + err.toString());
    } else {
      css_output = res.css.toString();
      cb();
    }
  });
}, 1000);

// -------------------------------------------------------
// Configuring the current version of the application.

function GitClean(){
  try {
    exec("git diff --quiet HEAD");
  } catch(e) {
    return false;
  }
  return true;
}
function GenVersion(){
  var v = package.version;
  var clean = GitClean();
  // Testing for a GIT repo... if not in a production environment.
  if (production === false){
    try{
      var res = exec("git rev-parse --abbrev-ref HEAD").toString();
      v += "-[" + res.trim();

      res = exec("git rev-parse HEAD").toString();
      v += ":" + res.substring(0, 5) + ((clean) ? "" : "-X") + "]";
    } catch(e) {
      if (v !== package.version){
        v += "]"; // If v doesn't match package.version, then assume that the first git call worked.
      }
    }
  }

  return v;
}


// ---------------------------------------------------
// Configuring the express server.
app.set('views', path.join(__dirname, "/views"));
app.engine('html', require('ejs').renderFile);
app.set('view engine', 'html');
app.use("/app", express.static(path.join(__dirname, "/app")));
vendors.modules.forEach((m) => {
  var p = path.normalize(path.join(__dirname, vendors.default_path, m.path));
  var url = path.join(vendors.url_path, m.url_path);
  app.use(url, express.static(p));
});
app.use("/app/css/nespaint.css", function(req, res){
  res.set("Content-Type", "text/css");
  res.send(new Buffer.from(css_output));
});
app.get('/', function(req, res){
  res.render('index.html', {version:GenVersion(), author:package.author, description:package.description, license:package.license});
});



// ----------------------------------------------------
// Watching for any needed file updates (to minimize the need to restart the server.
watcher.on('ready', () => {
    generateCSS(path.join(SASS_PATH, SASS_FILE), (err) => {
      if (err){
        console.log("ERROR: " + err);
        exit();
      } else {
        startServer();
      }
    }); 
});
watcher.on('change', (fpath) => {
  generateCSS(path.join(SASS_PATH, SASS_FILE), (err) => {
    if (err)
      console.log("WARNING: " + err);
  });
});


// --------------------------------------------------
// Announce app version!
console.log("NESPaint (v" + GenVersion() + ") Server");


// --------------------------------------------------
// KICK THE PIG!

function startServer(){
  // Check if given SSL key and cert(s). If so, attempt to start an HTTPS server and
  // reroute HTTP requests to HTTPS.
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

  // Start the HTTP server.
  http.createServer(app).listen(port, () => {
    console.log("HTTP Listening on port " + port + "!");
  });
}






