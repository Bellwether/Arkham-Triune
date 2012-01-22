var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var struct = {
  name: String,
  group: String,
  level: Number,
  points: { type: Number, default: 0 },
  weight: { type: Number, default: 0 }
}
var schema = new Schema(struct);

schema.virtual('landscape').get(function () {
  return this.group !== 'monster' &&
         this.group !== 'summoning' &&
         this.group !== 'magic';	
});
schema.virtual('matchable').get(function () {
  return this.group !== 'monster' &&
         this.group !== 'magic';	
});
schema.virtual('seedable').get(function () {
  return parseInt(this.level) === 1 && this.landscape;
});
schema.virtual('warpingMonster').get(function () {
  return this.monster && this.level > 2;
});
schema.virtual('trapableMonster').get(function () {
  return this.monster && this.level < 3;	
});
schema.virtual('transportableMonster').get(function () {
  return this.monster && this.level < 4 && this.name !== 'Cats of Ulthar';
});

schema.virtual('monster').get(function () {
  return this.group === 'monster';
});
schema.virtual('magic').get(function () {
  return this.group === 'magic';
});
schema.virtual('summoning').get(function () {
  return this.group === 'summoning';
});
schema.methods.matchPoints = function matchPoints(matchCount) {
  matchCount = parseInt(matchCount);
  if (matchCount === 3) {
    return this.points * 3;
  } else if (matchCount === 4) {
    return (this.points * 4) * 2;
  } else if (matchCount >= 5) {
    return (this.points * 5) * 3;
  } else {
    return 0;	
  }
}
schema.virtual('compressed').get(function () {
  return {_id: this._id, name: this.name, group: this.group};
});

schema.methods.nextUpgrade = function nextUpgrade() {
  return model.nextUpgrade(this._id);
}
schema.statics.nextUpgrade = function nextUpgrade(tileId) {
  var tile = this.lookups[tileId];

  if (!tile) return null;

  for (var i = 0; i < this.list.length; i++) {
    var isGroupMatch = this.list[i].group === tile.group;
    var isLevelMatch = parseInt(this.list[i].level) === parseInt(tile.level + 1);

    if (isGroupMatch && isLevelMatch) {
	  return this.list[i];
    }
  }
}
schema.statics.findByName = function findByName(name) {
  for (var i = 0; i < this.list.length; i++) {
    if (this.list[i].name === name) return this.list[i];
  }
}

var model = mongoose.model('Tile', schema);

// cached lookup tables, by index and by _id key
model.list = [];
model.lookups = {};
model.find({}, function(err, docs) {
  if (docs) {
    for (var i = 0; i < docs.length; i++) {
      model.list.push(docs[i]);
      model.lookups[docs[i]._id] = docs[i];
    }	
  }
});

module.exports = {
  Struct: struct,
  Schema: schema,
  Model: model
}