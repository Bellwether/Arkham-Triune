var Payment = require('./../../models/payment').Model;

var FacebookPaymentRequest = function(req, params) {
  this.host = 'http://'+req.header('host')+'/';
  this.order_id = params.order_id;

  this.buyer = params.buyer;
  this.receiver = params.receiver;
  this.order_info = params.order_info;
  this.method = params.method;

  this.status = params.status;
  if (params.order_details) {
    var detailsInStringForm = typeof params.order_details === 'string';
    this.order_details = detailsInStringForm ? JSON.parse(params.order_details) : params.order_details;
  }
}
FacebookPaymentRequest.prototype.paymentId = function paymentId() {
  return this.order_info || (this.order_details ? this.order_details.order_info : null);
}
FacebookPaymentRequest.prototype.itemToJson = function itemToJson(doc) {
  var host = this.host;
  return {
    content:[
      {
        "title": doc.facebook.title,
        "price": doc.facebook.price,
        "description": doc.facebook.description,
        "item_id": doc.facebook.item_id,

        "image_url": host+"apple-touch-icon.png",
        "product_url": host+"apple-touch-icon.png"
      }
   ],
   method: "payments_get_items"
  };
}
FacebookPaymentRequest.prototype.paymentToJson = function paymentToJson(doc) {
  return  {
    content: {
      status: 'settled',
      order_id: doc.orderId
    },
    method: "payments_status_update"
  };
}
FacebookPaymentRequest.prototype.isRequestingItem = function isRequestingItem() {
  return this.method === 'payments_get_items';
}
FacebookPaymentRequest.prototype.isCompletingPurchase = function isCompletingPurchase() {
  return this.method === 'payments_status_update';
}
FacebookPaymentRequest.prototype.findOrder = function findOrder(callback) {
  var query = {_id: this.paymentId()};
  Payment.findOne(query, callback);
}
module.exports = FacebookPaymentRequest;