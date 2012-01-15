var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var tile = require('./tile');
var cell = require('./cell');
var seeder = require('./../lib/mechanics/seeder');
var dealer = require('./../lib/mechanics/dealer');
var matcher = require('./../lib/mechanics/matcher');
var monsters = require('./../lib/mechanics/monsters');
var rewarder = require('./../lib/mechanics/rewarder');
var Turn = require('./turn').Model;

var struct = {
  abeyantTileId: Schema.ObjectId,
  active: {type: Boolean, default: true},	
  cells: [cell.Struct],
  moves: {type: Number, default: 0},
  nextTileId: Schema.ObjectId,
  playerId: String,
  score: {type: Number, default: 0}
}
var schema = new Schema(struct);
schema.virtual('size').get(function () {
  return 7;
});
schema.virtual('completed').get(function () {
  for (var i = 0; i < this.cells.length; i++) {
    if (this.cellAt(i).empty) return false;
  }
  return true;
});
schema.virtual('nextTile').get(function () {
  return this.nextTileId ? tile.Model.lookups[this.nextTileId] : null;
});
schema.virtual('abeyantTile').get(function () {
  return this.abeyantTileId ? tile.Model.lookups[this.abeyantTileId] : null;
});
schema.methods.cellIndicesAt = function cellIndicesAt(index) {
  var indices = {center: parseInt(index)};
  indices.top = parseInt(indices.center - this.size);
  indices.bottom = parseInt(indices.center + this.size);
  indices.left = parseInt(indices.center - 1);
  indices.right = parseInt(indices.center + 1);
  indices.hasTop = indices.center >= this.size;
  indices.hasBottom = indices.center < this.cells.length - this.size;
  indices.hasLeft = indices.center % this.size !== 0;
  indices.hasRight = indices.center % this.size !== this.size-1;

  return indices;
}
schema.methods.cellAt = function cellAt(index) {
  return index < this.cells.length ? new cell.Model(this.cells[index]) : null;
}
schema.methods.tileAt = function tileAt(index) {
  var cell = this.cellAt(index);
  var tileId = cell ? cell.tileId : null;
  return tileId ? tile.Model.lookups[tileId] : null;
}
schema.methods.dealTile = function dealTile() {
  this.nextTileId = dealer.deal(tile.Model.list)._id;
}
schema.methods.placeNextTile = function placeNextTile(index) {
  var cell = this.cellAt(index);
  if (cell && cell.empty) {	
    this.cells[index].tileId = this.nextTileId;	
    return true;
  } else {
    return false;	
  }
}
schema.methods.awardPoints = function awardPoints(matchedTiles) {
  var points = rewarder.award(this, matchedTiles.matches);
  this.score = this.score + points;
  return points;
}
schema.methods.awardWisdom = function awardWisdom(points) {
  var wisdom = 0;
  return wisdom;
}
schema.methods.match = function match(index) {
  var matches = [index];
  matcher.matchNeighbors(this, index, matches);	
	
  var matched = {matches: matches};	
  if (matches.length >= 3) {
    matched.points = this.awardPoints(matched);
    matched.wisdom = this.awardWisdom(matched.points);
    var upgrade = this.upgradeCells(index, matches);

console.log("MATCH and UPGRADE "+JSON.stringify(upgrade)+" "+JSON.stringify(matched))
    if (upgrade){
      matched.upgrade = upgrade.compressed;
      var deepMatched = this.match(index);

      if (deepMatched.matches.length >= 3) {
        matcher.mergeMatched(matched, deepMatched);
      }
    }
  }
console.log("RETURNING "+JSON.stringify(matched))
  return matched;
}
schema.methods.upgradeCells = function upgradeCells(index, matches) {
  var tileId = this.cells[index].tileId;
  var upgrade = tile.Model.nextUpgrade(tileId);
  if (!upgrade) return;

  for (var i = 0; i < matches.length; i++) {
	this.cells[matches[i]].tileId = null;
  }
  this.cells[index].tileId = upgrade._id;

  return upgrade;
}
schema.methods.complete = function complete() {
  this.active = false;
}
schema.methods.useMagic = function useMagic(index, callback) {
  var cell = this.cellAt(index);
  var removed = null;
  if (cell && !cell.empty) {
    this.cells[index].tileId = null;
    removed = [index];
  }
  this.dealTile();
  this.markModified("cells");
  this.save(function (err, doc) {
    callback(err, doc, null, null, removed);
  });
}
schema.methods.swapAbeyant = function swapAbeyant(callback) {
  var abeyantId = this.abeyantTileId;
  var nextId = this.nextTileId;
  this.nextTileId = abeyantId;
  this.abeyantTileId = nextId;

  if (!this.nextTileId) this.dealTile();

  this.save(function (err, doc) {
    callback(err, doc);
  });
}
schema.methods.emplace = function emplace(index, callback) {
  index = parseInt(index);
  if (this.nextTile.magic) return this.useMagic(index, callback);

	//   if (this.placeNextTile(index)) {
	// var turn = new Turn();
	// this.dealTile();
	// turn.addNextTile(this.nextTile);
	// 
	//     this.markModified("cells");
	//     this.save(function (err, doc) {
	//       callback(err, doc, turn.serialize);
	//     });	
	//   } else {
	//     callback("no cell available at "+index);
	//   }


  var cell = this.cellAt(index);
  if (cell && cell.empty) {
    this.cells[index].tileId = this.nextTileId;
    var matched = this.match(index);
    this.dealTile();
    var movement = monsters.move(this, tile.Model.list, index);
    	
    this.moves = this.moves + 1;
    if (this.completed) this.complete();
  
    this.markModified("cells");
    this.save(function (err, doc) {
      callback(err, doc, matched, movement);
    });
  } else {
    callback("no cell available at "+index);
  }
}

schema.statics.FindActive = function FindActive(playerId, callback) {
  var query = {playerId: playerId, active: true};
  return this.findOne(query, callback);
}
schema.statics.FindComplete = function FindComplete(playerId, callback) {
  var query = {playerId: playerId, active: false};
  return this.findOne(query, callback);
}
schema.statics.FindOrCreate = function FindOrCreate(playerId, callback) {
  var self = this;
  return this.FindActive(playerId, function(err, doc) {
    if (err || doc) {
      callback(err, doc);
    } else {
      self.Create(playerId, callback);
    }
  });
}
schema.statics.Create = function Create(playerId, callback) {
  var map = new this({
    playerId: playerId
  });
  for (var i = 0; i < map.size * map.size; i++) {
    map.cells.push({tileId: null});
  }
  seeder.populate(map, tile.Model.list);
  map.dealTile();

  return map.save(function (err, doc) {
    callback(err, doc);
  });
}

var model = mongoose.model('Map', schema);

module.exports = {
  Struct: struct,
  Schema: schema,
  Model: model
}