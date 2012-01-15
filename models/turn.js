var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var Tile = {
  _id: String,	
  name: String
};

var Path = new Schema({
  path: [Number]
});

var Match = new Schema({
  cells: [Number],
  index: Number,
  tile: Tile
});

var Summoning = new Schema({
  move: [Path],
  tile: Tile
});

var struct = {
  matched: [Match],
  trapped: {
    traps: [Number],
    tile: Tile
  },
  moved: {
    moves: [Path],
    summonings: [Summoning]
  },
  removed: [Number],
  points: Number,
  wisdom: Number,
  nextTile: Tile
}
var schema = new Schema(struct);
schema.methods.addMatch = function addMatch() {
}
schema.methods.addNextTile = function addNextTile(tile) {
  if (!tile) return;
  this.nextTile._id = tile._id;
  this.nextTile.name = tile.name;
}
schema.virtual('serialize').get(function() {
  var json = {}
  if (this.matched.length) json.matched = this.matched;
  if (this.trapped.traps.length) json.trapped = this.trapped;
  if (this.moved.moves.length || this.moved.summonings.length) json.moved = this.moved;
  if (this.removed.length) json.removed = this.removed;
  if (this.points) json.points = this.points;
  if (this.wisdom) json.wisdom = this.wisdom;
  if (this.nextTile) json.nextTile = this.nextTile;
  return json;
});

var model = mongoose.model('Turn', schema);

module.exports = {
  Struct: struct,
  Schema: schema,
  Model: model
}