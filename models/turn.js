var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var Tile = {
  _id: String,	
  name: String
};

var Path = {
  path: [Number]
};

var Match = new Schema({
  cells: [Number],
  index: Number,
  tile: Tile,
  points: Number
});
Match.virtual('matchLength').get(function () {
  return this.cells.length + (this.index ? 1 : 0);
});
Match.methods.hasCell = function hasCell(index) {
  if (parseInt(this.index) === index) return true;
  for (var i = 0; i < this.cells.length; i++) {
    if (parseInt(this.cells[i]) === index) return true;
  }
  return false;
}

var Summoning = new Schema({
  move: [Path],
  tile: Tile
});

var struct = {
  placed: {
    tile: Tile,
    index: Number
  },
  matched: [Match],
  trapped: {
    traps: [Number],
    tile: Tile
  },
  moved: {
    moves: [Path],
    summonings: [Summoning]
  },
  enchanted: {
    blessed: [Number],
    cursed: [Number]
  },
  removed: [Number],
  points: Number,
  wisdom: Number,
  nextTile: Tile,
  complete: Boolean
}
var schema = new Schema(struct);

schema.virtual('lastMatch').get(function() {
  return this.matched.length > 0 ? this.matched[this.matched.length - 1] : null;
});
schema.virtual('serialize').get(function() {
  var json = {placed: {index: this.placed.index}}
  if (this.placed.tile.name) json.placed.tile = this.placed.tile;
  if (this.matched.length) json.matched = this.matched;
  if (this.trapped.traps.length > 0) json.trapped = this.trapped;
  if (this.moved.moves.length) {
    json.moved = {moves: []};
    for (var i = 0; i < this.moved.moves.length; i++) json.moved.moves.push(this.moved.moves[i]); 
  }
  if (this.removed.length > 0) json.removed = this.removed;
  if (this.complete) json.complete = this.complete;
  if (this.points) json.points = this.points;
  if (this.wisdom) json.wisdom = this.wisdom;
  if (this.enchanted.blessed.length + this.enchanted.cursed.length > 0) json.enchanted = this.enchanted;

  if (this.nextTile) json.nextTile = this.nextTile;
  return json;
});
schema.methods.newMatch = function newMatch(index) {
  return new schema({index: index});
}
schema.methods.setRewardsFromMatched = function setRewardsFromMatched() {
  this.points = 0;
  this.wisdom = 0;

  for (var i = 0; i < this.matched.length; i++) {
    this.points = this.points + this.matched[i].points;
    this.wisdom = this.wisdom + this.matched[i].wisdom;
console.log('points/wisdom '+this.points+' '+this.wisdom +' matched was '+JSON.stringify(this.matched[i]))
  }
}
schema.methods.removeCell = function removeCell(index) {
  this.removed.push(parseInt(index));
}
schema.methods.addMatch = function addMatch(match) {
  this.matched.push(match);
}
schema.methods.addMove = function addMove(path) {
  this.moved.moves.push({path: path});
}
schema.methods.addTrap = function addTrap(index, tile) {
  this.trapped.traps.push(index);
  if (tile) this.trapped.tile = {name: tile.name};
}
schema.methods.addPlacedTile = function addPlacedTile(tile) {
  if (tile) this.placed.tile.name = tile.name;
}
schema.methods.addNextTile = function addNextTile(tile) {
  if (tile) this.nextTile.name = tile.name;
}

schema.virtual('index').get(function(val) {
  return parseInt(this.placed.index);
});

var model = mongoose.model('Turn', schema);

module.exports = {
  Struct: struct,
  Schema: schema,
  Model: model,
  Match: mongoose.model('Match', Match)
}