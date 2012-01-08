var log = require('util').log;
var map = require('./../models/map');

var AppController = function(req, res, next) {
  this.request = req;
  this.response = res;
  var self = this;

  function DefaultView() {
    return req.params.controller+"/"+req.params.action;
  }
  function DefaultLayout() {
    return 'app/layouts/page';
  }

  var redirect = res.redirect;
  res.redirect = function(url) {
	res.redirect = redirect;
	url = req.headers.origin ? req.headers.origin + url : url;
    return res.redirect(url);	
  }

  var render = res.render;
  res.render = function(template, options) {
	res.render = render;
	var view = (typeof template === 'string') ? template : DefaultView();
	options = (typeof template === 'object') ? template : (options || {});

	options.layout = ('layout' in options) ? options.layout : DefaultLayout();
	log("SERVER rendering "+view)
    return res.render(view, options);
  };

  function renderAppIndex(req, res) {
    var playerId = req.authentication.playerId;

    function onMapCreated(err, doc) {
      res.render('app/index');
    }
    function onMapFound(err, doc) {
      if (err) {
        res.render('app/index');
      } else if (doc) {
        res.render('app/index', {map: doc});
      } else {
        map.Model.Create(playerId, onMapCreated);
      }
    }

    map.Model.FindOrCreate(playerId, onMapFound);
  }

  this.AppRoutes = {
    index: renderAppIndex,
    create: renderAppIndex
  }

  this.before_filter = function(req, res, callback) {
    callback(true);	
  }

  this.after_filter = function() {
  }
}

module.exports = {
  Controller: AppController,
  Routes: ['index','create']
}