var fs = require('fs');
var path = require('path');
var log = require('util').log;
var express = require('express');
var statics = require('./static');
var mvc = require('./mvc');
var db = require('./database');
var helpers = require('./view_helper');
var session = require('./session');
var auth = require('./authentication');
var httpProxy = require('http-proxy');

var CERT_PATH = path.normalize(__dirname + '../../../config/tls')

var tls = {
  https: {
    key: fs.readFileSync(CERT_PATH+'/dev.pem', 'utf8'),
    cert: fs.readFileSync(CERT_PATH+'/dev-cert.pem', 'utf8')
  }
};

var GameServer = function(app) {

  function useBody(app) {
    app.use(express.bodyParser());
    app.use(express.methodOverride());	
  }
		
  return {
    Start: function() {
	  db.init(app);
	  session.init(app, db.config);
      statics.init(app);

      useBody(app);
      auth.init(app);
	  mvc.init(app);
	  helpers.init(app);

	  app.register('.html', require('ejs'));
	  app.set('view engine', 'html');

	  var port = process.env.PORT || 3000;
	  app.listen(port, function () {
        log("SERVER listening on port "+port);
	  });
	
      httpProxy.createServer(port, 'localhost', tls).listen(443);
      httpProxy.createServer(port, 'localhost').listen(80);
    }
  }
}


exports.RunApp = function () {
  var app = express.createServer();
  var game = new GameServer(app);

  game.Start();
}

exports.RunDaemons = function () {
}