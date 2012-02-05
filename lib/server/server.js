var fs = require('fs');
var path = require('path');
var log = require('util').log;
var https = require('https');
var httpProxy = require('http-proxy');
var express = require('express');
var statics = require('./static');
var mvc = require('./mvc');
var db = require('./database');
var helpers = require('./view_helper');
var session = require('./session');
var auth = require('./authentication');
var facebook = require('../facebook/canvas');
var leaderboard = require('../../models/leaderboard');
var cronJob = require('cron').CronJob;

var CERT_PATH = path.normalize(__dirname + '../../../config/tls');
var tls = {
  https: {
    key: fs.readFileSync(CERT_PATH+'/dev.pem', 'utf8'),
    cert: fs.readFileSync(CERT_PATH+'/dev-cert.pem', 'utf8')
  }
};

function isRoot() {
  return process.getuid() === 0;
}

var GameServer = function(app) {
  function useBody(app) {
    app.use(express.bodyParser());
    app.use(express.methodOverride());	
  }

  function dropPrivileges() {	
    var defaultUser = 501;
    try {
      if (isRoot()) process.setuid(defaultUser);
    } catch (err) {
      console.log('Failed to drop user privileges: ' + err);
      process.exit(1);
	}	
  }
	
  return {
    Start: function() {
	  db.init(app);
	  session.init(app, db.config);
      statics.init(app);

      useBody(app);
	  facebook.init(app);
      auth.init(app);
	  mvc.init(app);
	  helpers.init(app);
	
	  app.register('.html', require('ejs'));
	  app.set('view engine', 'html');

      // HTTP app server
	  var port = process.env.PORT || 3000;
	  app.listen(port, function () {
        log("SERVER listening on port "+port);
	  });

      // HTTP proxy server	
      httpProxy.createServer(port, 'localhost').listen(80);

      // HTTPS proxy server
	  app.configure('production', function() { 
        tls.https = {
          key: fs.readFileSync('/etc/ssl/private/arkhamtriune.key.pem', 'utf8'),
          cert: fs.readFileSync('/etc/ssl/certs/arkhamtriune.cert.pem', 'utf8')
	    };
      });
      var proxy = new httpProxy.HttpProxy({
        target: { host: 'localhost', port: port }
      });
      express.createServer(tls.https, function (req, res) {
	    proxy.proxyRequest(req, res)
      }).listen(443);

      setTimeout(dropPrivileges, 500);
    }
  }
}


exports.RunApp = function () {
  if (!isRoot()) {
    log("Root privileges required to run server; try sudo")
    process.exit(1);
    return;
  }
	
  var app = express.createServer();
  var game = new GameServer(app);

  game.Start();
}

exports.RunDaemons = function () {
  var hourlyCron = '0 0 * * * *';
  var dailyCron = '00 00 3 * * *'; // 3:00 am 

  cronJob(dailyCron, function() {
    log("Running leaderboard cron job " + Date.now());
    leaderboard.Model.Rank();
  });
}