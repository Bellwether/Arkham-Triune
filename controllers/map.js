var baseController = require('./app').Controller;
var map = require('./../models/map');

var Controller = function(req, res) {
  baseController.call(this, req, res);
};

routes = {
  update: function(req, res) {
    var playerId = req.authentication.playerId;
    var index = req.body.index;

    function onMapUpdated(err, doc, matches, monsters, removed) {
      if (doc && req.body.abeyant) {
        var abeyant = doc.abeyantTile ? doc.abeyantTile.compressed : null;
        var next = doc.nextTile ? doc.nextTile.compressed : null;
        res.send({abeyant: abeyant, next: next});
      } else if (doc && doc.completed) {
        res.send({completed: doc.completed, url: '/maps/'+doc._id});
      } else if (doc) {
        var tile = doc.nextTile.compressed;
        res.send({tile: tile, matched: matches, monsters: monsters, removed: removed});
      } else {
        res.send({err: err || "Cannot update map"});
      }      
    }
    function onMapFound(err, doc) {
      if (doc && req.body.abeyant) {
        doc.swapAbeyant(onMapUpdated);
      } else if (doc) {	
        doc.emplace(index, onMapUpdated);
      } else {
        res.send({err: err || "Map missing"});
      }	
    }
    map.Model.FindActive(playerId, onMapFound);
  },

  show: function(req, res) {
    var playerId = req.authentication.playerId;	

    function onMapFound(err, doc) {
      if (doc) {
        res.render('map/show', {map: doc, layout: 'app/layouts/dialog'});
      } else {
        res.redirect('/')
      }	
	}
    map.Model.FindComplete(playerId, onMapFound);
  },

  destroy: function(req, res) {
	console.log('****')
    res.redirect('/')
  }
}
Controller.prototype.Routes = routes;

module.exports = {
  Controller: Controller,
  Routes: Object.keys(Controller.prototype.Routes)
}