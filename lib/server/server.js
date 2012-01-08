var log = require('util').log;
var express = require('express');
var statics = require('./static');
var mvc = require('./mvc');
var db = require('./database');
var helpers = require('./view_helper');
var session = require('./session');
var auth = require('./authentication');

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