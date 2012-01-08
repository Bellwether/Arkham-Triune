var express = require('express');
var db = require('connect-mongo');

var SECRET = 'thepowercosmic';
var KEY = 'cryptkeeper';

exports.init = function(app, config) {
  config.collection = 'sessions';
  var store = new db(config);

  express.session.ignore.push('/robots.txt');
  express.session.ignore.push('/css');
  express.session.ignore.push('/js');
  express.session.ignore.push('/img');

  var hour = 1800000;
  var maxSessionAge = new Date(Date.now() + hour);
  var session = express.session({
    secret: SECRET,
    maxAge: maxSessionAge,
    store: store,
    key: KEY
  });

  app.use(express.cookieParser());
  app.use(session);
};