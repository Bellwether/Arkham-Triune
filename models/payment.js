var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var Item = require('./item').Model;

var struct = {
  createdAt: Date,
  itemId: String,
  orderDetails: {},
  orderId: String,
  playerId: String,
  status: {type: String, default: 'pending'}
}
var schema = new Schema(struct);
schema.virtual('item').get(function () {
  return Item.lookups[this.itemId];
});
schema.virtual('placed').get(function () {
  return this.status === 'placed';
});

schema.statics.Create = function Create(playerId, itemId, callback) {
  var createdAt = Date.now();
  var payment = new this({
    createdAt: createdAt,
    itemId: itemId
  });

  return payment.save(function (err, doc) {
    if (typeof callback === 'function') callback(err, doc);
  });
}

var model = mongoose.model('Payment', schema);

module.exports = {
  Struct: struct,
  Schema: schema,
  Model: model
}