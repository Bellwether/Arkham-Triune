var mongoose = require('mongoose');
var log = require('util').log;

var DATABASE_NAME = 'arkhamtriune';
var EXPIRED_SESSION_TIMEOUT = 1200;
var config = {
  db: DATABASE_NAME,
  clear_interval: EXPIRED_SESSION_TIMEOUT
};

exports.init = function (app) {
  function developmentConfig() {
    config.db = DATABASE_NAME;
    config.host = 'localhost';
    config.port = 27017;
  }
  function productionConfig() {
    config.db = DATABASE_NAME;
    config.host = '127.0.0.1';
    config.port = 27017;
  }

  app.configure('development', developmentConfig);
  app.configure('production', productionConfig);

  config.url = 'mongodb://'+config.host+':'+config.port+'/'+config.db;
  mongoose.connect(config.url, function(err) {
    if (err) {
	  log("ERROR SERVER can't connect to database at "+config.url+", "+JSON.stringify(err));
	  throw err;
	} else {
	  log("SERVER connected to database at "+config.url);
	}
  });

  exports.config = config;
};

