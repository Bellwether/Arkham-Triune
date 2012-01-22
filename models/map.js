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
var Match = require('./turn').Match;

var struct = {
  suspendedTileId: Schema.ObjectId,
  active: {type: Boolean, default: true},	
  cells: [cell.Struct],
  moves: {type: Number, default: 0},
  nextTileId: Schema.ObjectId,
  playerId: String,
  score: {type: Number, default: 0}
}
var schema = new Schema(struct);
schema.virtual('size').get(function () {
  return 6;
});
schema.virtual('completed').get(function () {
  var isComplete = true;
  this.cells.forEach(function(cell) {
    if (!cell.tileId) {
      isComplete = false;
      return;
    }
  });
  return isComplete;
});
schema.virtual('nextTile').get(function () {
  return this.nextTileId ? tile.Model.lookups[this.nextTileId] : null;
});
schema.virtual('suspendedTile').get(function () {
  return this.suspendedTileId ? tile.Model.lookups[this.suspendedTileId] : null;
});
schema.methods.neighborsFor = function neighborsFor(index) {
  index = parseInt(index);
  var neighbors = [];

  var top = parseInt(index - this.size);
  var bottom = parseInt(index + this.size);
  var left = parseInt(index - 1);
  var right = parseInt(index + 1);  

  if (index >= this.size) neighbors.push(top);
  if (index < this.cells.length - this.size) neighbors.push(bottom);
  if (index % this.size !== 0) neighbors.push(left);
  if (index % this.size !== this.size-1) neighbors.push(right);

  return neighbors;
}
schema.methods.emptyCells = function emptyCells() {
  var cells = [];
  for (var i = 0; i < this.cells.length; i++) {
    if (!cell.tileId) cells.push(i);
  };
  return cells;
}
schema.methods.cellsByGroup = function cellsByGroup(name) {
  var cells = [];
  for (var i = 0; i < this.cells.length; i++) {
    if (this.cells[i].tileId && this.tileAt(i).group === name) cells.push(i);
  }
  return cells;
}
schema.methods.cellsByName = function cellsByName(name) {
  var cells = [];
  for (var i = 0; i < this.cells.length; i++) {
    if (this.cells[i].tileId && this.tileAt(i).name === name) cells.push(i);
  }
  return cells;
}
schema.methods.cellAt = function cellAt(index) {
  if (index < this.cells.length) {
    var data = this.cells[index];
    var c = new cell.Model(data)
    data.neighbors = data.neighbors || this.neighborsFor(index);
    c.neighbors = data.neighbors;

    return c;
  }
}
schema.methods.tileAt = function tileAt(index) {
  if (index < this.cells.length) {
    var tileId = this.cells[index].tileId;
    return tileId ? tile.Model.lookups[tileId] : null;
  }
}
schema.methods.dealTile = function dealTile() {
  this.nextTileId = dealer.deal(tile.Model.list)._id;
}
schema.methods.placeNextTile = function placeNextTile(index) {
  var cellEmpty = this.cells[index].tileId ? false : true;
  if (cellEmpty) {	
    this.cells[index].tileId = this.nextTileId;	
    return true;
  } else {
    return false;
  }
}
schema.methods.awardPoints = function awardPoints(match) {
  match.points = rewarder.points(this, match);
  this.score = this.score + match.points;
}
schema.methods.awardWisdom = function awardWisdom(match) {
  return rewarder.wisdom(match.points);
}
schema.methods.trap = function trap(index) {
  var trappedTile = tile.Model.findByName("Magic Pentagram");
  if (trappedTile) this.cells[index].tileId = trappedTile._id;
  return trappedTile;
}
schema.methods.upgradeCells = function upgradeCells(match) {
  var tileId = this.cells[match.index].tileId;
  // var tileId = match.tile._id;
  var upgradeTile = tile.Model.nextUpgrade(tileId);
console.log("UPGRADE TILE FROM "+JSON.stringify(match.tile)+" TO "+JSON.stringify(upgradeTile))
  if (!upgradeTile) return;

  var self = this;
  match.cells.forEach(function(index) {
	self.cells[index].tileId = null;
  })
  this.cells[match.index].tileId = upgradeTile._id;
}
schema.methods.upgradeTurnMatched = function upgradeTurnMatched(turn) {
  var self = this;
  turn.matched.forEach(function(match) {
    self.awardPoints(match);
    self.awardWisdom(match);
    self.upgradeCells(match);
  });		
  turn.setRewardsFromMatched();
}
schema.methods.complete = function complete(turn) {
  this.active = false;
  if (turn) turn.complete = true
}
schema.methods.useMagic = function useMagic(turn, callback) {
  var title = this.nextTile.name;

  if (title === 'Elder Sign') {
    this.useElderSign(turn);
  } else if (title === 'Silver Key') {
    this.useSilverKey(turn);
  } else if (title === 'Mythos Tome') {
    this.useMythosTome(turn);
  }

  if (this.completed) {
    this.complete(turn);
  } else {
    var hasAssignedNextTile = turn.nextTile.name ? true : false;
    if (!hasAssignedNextTile) {
      this.dealTile();
      turn.addNextTile(this.nextTile);
    }
  }

  this.markModified("cells");
  this.save(function (err, doc) {
    callback(err, turn);
  });
}
schema.methods.useMythosTome = function useMythosTome(turn) {
  if (this.cells[turn.index].tileId) {
    this.nextTileId = this.cells[turn.index].tileId;
    this.cells[turn.index].tileId = null;
    turn.removeCell(turn.index);
    turn.addNextTile(this.nextTile);
  }	
}
schema.methods.useElderSign = function useElderSign(turn) {
  if (this.cells[turn.index].tileId) {
    this.cells[turn.index].tileId = null;
    turn.removeCell(turn.index);
  }
}
schema.methods.useSilverKey = function useSilverKey(turn) {
  this.moves = this.moves + 1;

  var index = turn.index
  var cell = this.cellAt(index);
  var neighbors = cell.emplacedNeighbors(this.cells);

  function compareMatch(first, second) {
    var firstMatchCount = 0;
    var secondMatchCount = 0;
    if (first) {
      first.forEach(function(match) {
        firstMatchCount = firstMatchCount + match.cells.length;
      })
    }
    if (second) {
      second.forEach(function(match) {
        secondMatchCount = secondMatchCount + match.cells.length;
      })
    }
	console.log('compareMatch '+firstMatchCount+' > '+secondMatchCount+' between first '+JSON.stringify(first)+' and second '+JSON.stringify(first))
	
	return firstMatchCount >= secondMatchCount ? first : second;
  }
  
  var bestMatch = null;
  var self = this;
  neighbors.forEach(function(i) {	
    var matches = [];
    if (self.cells[i].tileId && !self.tileAt(i).monster) {
      self.cells[index].tileId = self.cells[i].tileId;
      matcher.matchRepeat(self, Match, matches, index);
    }

    if (matches.length > 0) {
      var finalMatchIndex = matches.length - 1;
      var match = matches[finalMatchIndex];
console.log('--- comparing key matches '+JSON.stringify(matches)+ ' ------ '+JSON.stringify(bestMatch))
      bestMatch = compareMatch(matches, bestMatch);
console.log('BEST TILE is '+JSON.stringify(bestMatch[0].tile))
      self.cells[index].tileId = bestMatch[0].tile._id;
    }
  });

  if (bestMatch) {
console.log('upgrading key best match '+JSON.stringify(bestMatch))	

    bestMatch.reverse();
    turn.matched = bestMatch;
    this.upgradeTurnMatched(turn);
	console.log('upgrading key best match '+JSON.stringify(turn))
  } else {
    var failedKeyTile = tile.Model.findByName("Magic Pentagram");
    this.cells[index].tileId = failedKeyTile._id;
    turn.addPlacedTile(failedKeyTile);
  }

  monsters.act(this, turn);
}
schema.methods.matchCells = function matchCells(turn) {
  matcher.matchRepeat(this, Match, turn.matched, turn.index);

  if (turn.matched.length) {
    this.upgradeTurnMatched(turn);
    console.log('rewards for turn '+JSON.stringify(turn))    
  }
}
schema.methods.swapSuspended = function swapSuspended(callback) {
  var suspendedId = this.suspendedTileId;
  var nextId = this.nextTileId;
  this.nextTileId = suspendedId;
  this.suspendedTileId = nextId;

  var swapSlotEmpty = !this.nextTileId;
  if (swapSlotEmpty) this.dealTile();

  this.save(function (err, doc) {
    callback(err, doc);
  });
}

schema.methods.useTile = function useTile(turn, callback) {
  if (this.placeNextTile(turn.index)) {
    if (this.tileAt(turn.index).landscape) {
      this.matchCells(turn);
    }
    monsters.act(this, turn);

	turn.addPlacedTile(this.nextTile);
    if (this.completed) {
      this.complete(turn);
    } else {
      this.dealTile();
      turn.addNextTile(this.nextTile);
    }

    this.markModified("cells");
    this.save(function (err, doc) {
      callback(err, turn);
    });	
  } else {
    callback("no cell available at "+turn.index);
  };
}

schema.methods.emplace = function emplace(index, callback) {
  var turn = new Turn({placed: {index: index}});
console.log("")
console.log("EMPLACE")
console.log("")		
  if (this.nextTile.magic) {
    return this.useMagic(turn, callback);
  } else {
    return this.useTile(turn, callback);	
  }
}

schema.statics.FindActive = function FindActive(playerId, callback) {
  var query = {playerId: playerId, active: true};
  return this.findOne(query, callback);
}
schema.statics.FindComplete = function FindComplete(mapId, callback) {
  var query = {_id: mapId, active: false};
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