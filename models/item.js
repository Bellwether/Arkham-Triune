var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var struct = {
  name: String,
  wisdom: Number
}
var schema = new Schema(struct);

var model = mongoose.model('Item', schema);

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