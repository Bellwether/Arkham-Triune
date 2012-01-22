var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var struct = {
  cursed: Boolean,
  tileId: Schema.ObjectId
}
var schema = new Schema(struct);
schema.virtual('empty').get(function () {
  return this.tileId ? false : true;
});
schema.virtual('neighbors').get(function () {
  return this._neighbors;	
});
schema.virtual('neighbors').set(function (val) {
  this._neighbors = val;
});
schema.methods.emptyNeighbors = function emptyNeighbors(cells) {
  var empty = [];
  for (var i = 0; i < this.neighbors.length; i++) {
	if (!cells[this.neighbors[i]].tileId) empty.push(this.neighbors[i])
  }
  return empty;
}
schema.methods.emplacedNeighbors = function emplacedNeighbors(cells) {
  var emplaced = [];
  for (var i = 0; i < this.neighbors.length; i++) {
	if (cells[this.neighbors[i]].tileId) emplaced.push(this.neighbors[i])
  }
  return emplaced;
}

var model = mongoose.model('Cell', schema);

module.exports = {
  Struct: struct,
  Schema: schema,
  Model: model
}