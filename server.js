const package = require("./package.json");

const exec = require('child_process').execSync;

const fs = require("fs");
const path = require("path");
const express = require("express");
const app = express();

const http = require("http");
const https = require("https");

const sass = require("sass");
const SASS_PATH = path.join(__dirname, "sass");
const CSS_PATH = path.join(__dirname, "app/css");

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

var generateCSS = debounce(function(src, dst, cb){
  sass.render({file: src}, (err, res)=>{
    if (err){
      cb("Failed to generate css - " + err.toString());
    } else {
      fs.writeFile(path.join(CSS_PATH, "nespaint.css"), res.css.toString(), (err) => {
        if (err)
          cb("Failed to write file '" + path.join(CSS_PATH, "nespaint.css") + "' - " + err.toString());
        else
          cb();
      });
    }
  });
}, 1000);

// -------------------------------------------------------
// Configuring the current version of the application.
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


// ---------------------------------------------------
// Configuring the express server.
app.set('views', path.join(__dirname, "/views"));
app.engine('html', require('ejs').renderFile);
app.set('view engine', 'html');
app.use("/app", express.static(path.join(__dirname, "/app")));
app.get('/', function(req, res){
  res.render('index.html', {version:version, author:package.author});
});



// ----------------------------------------------------
// Watching for any needed file updates (to minimize the need to restart the server.
watcher.on('ready', () => {
  // console.log("Watching path " + SASS_PATH);
  var dst = path.join(CSS_PATH, "nespaint.css");
  fs.access(dst, fs.constants.F_OK, (err) => {
    // Only try generating a new CSS if one doesn't already exists, or FORCECSSREGEN is true
    if (err || forceCSSRegen){
      if (!fs.existsSync(CSS_PATH)){
        try {
          fs.mkdirSync(CSS_PATH);
        } catch (e) {
          conosle.log("ERROR: " + e.toString());
          exit();
        }
      }

      generateCSS(path.join(SASS_PATH, "nespaint.scss"), path.join(CSS_PATH, "nespaint.css"), (err) => {
        if (err){
          console.log("ERROR: " + err);
          exit();
        } else {
          startServer();
        }
      });
    } else {
      startServer();
    }
  });
});
watcher.on('change', (fpath) => {
  // console.log("File " + fpath + " changed!");
  generateCSS(path.join(SASS_PATH, "nespaint.scss"), path.join(CSS_PATH, "nespaint.css"), (err) => {
    if (err)
      console.log("WARNING: " + err);
  });
});


// --------------------------------------------------
// Announce app version!
console.log("NESPaint (v" + version + ") Server");


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






