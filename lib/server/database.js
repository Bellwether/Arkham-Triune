var mongoose = require('mongoose');
var log = require('util').log;

var DATABASE_NAME = 'arkhamtriune';
var EXPIRED_SESSION_TIMEOUT = 1200;
var config = {
  db: DATABASE_NAME,
  clear_interval: EXPIRED_SESSION_TIMEOUT
};

exports.init = function (app) {
  function localConfig() {
    config.db = DATABASE_NAME;
    config.host = 'localhost';
    config.port = 27017;
  }
  function mongoLabConfig() {
    config.db = DATABASE_NAME;
    config.host = 'ds029787.mongolab.com';
    config.port = 29787;
    config.username = 'arkham';
    config.password = 'triune';
  }

  app.configure('development', localConfig);
  app.configure('production', mongoLabConfig);

  if (config.username && config.password) {
    config.url = 'mongodb://'+config.username+':'+config.password+'@'+config.host+':'+config.port+'/'+config.db;
  } else {
    config.url = 'mongodb://'+config.host+':'+config.port+'/'+config.db;	
  }

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

