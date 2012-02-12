var baseController = require('./app').Controller;
var client = require('../lib/facebook/client');
var Payment = require('./../models/payment').Model;
var Item = require('./../models/payment').Model;

var FacebookPaymentRequest = function(req, params) {
  this.host = 'http://'+req.header('host')+'/';
  this.order_id = params.order_id;

  this.buyer = params.buyer;
  this.receiver = params.receiver;
  this.order_info = params.order_info;
  this.method = params.method;

  this.status = params.status;
  this.order_details = params.order_details;
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

var FacebookAPIRequest = function(req) {
  var params = req.params || req.body || req.query || {};
  this.error = params.access_denied;
  this.error_description = params.error_description;
  this.code = params.code;

  if (req.params.method) {
    this.payment = new FacebookPaymentRequest(req, params);
  }
}
FacebookAPIRequest.prototype.hasError = function hasError() {
  return this.error ? true : false;
}
FacebookAPIRequest.prototype.isAuthenticating = function isAuthenticating() {
  return this.code ? true : false;
}
FacebookAPIRequest.prototype.isPaying = function isPaying() {
  return this.payment ? true : false;
}

var Controller = function(req, res) {
  baseController.call(this, req, res);
};

function authenticateUser(fbr) {
  var fb = new client();
  var code = fbr.code;

  fb.requestAccessToken(fbr.code, function(err, data) {
    console.log("requestAccessToken() "+err+' '+JSON.stringify(data));
  });
}
function processPayment(fbr, res) {
  fbr.payment.findOrder(function(err, doc) {	
    if (fbr.payment.isRequestingItem()) {
console.log("findOrder itemToJson "+JSON.stringify(fbr.payment.itemToJson(doc.item))+' (err='+err+')')
      res.json(doc ? fbr.payment.itemToJson(doc.item) : {err: err});
    } else if (fbr.payment.isCompletingPurchase()) {
      doc.orderId = fbr.payment.order_id;
      doc.status = fbr.payment.status;
      doc.orderDetails = fbr.payment.order_details;

      if (doc.placed) {
        Item.Purchase(doc.playerId, doc.itemId);
      }
      doc.save();

console.log("findOrder paymentToJson "+JSON.stringify(fbr.payment.paymentToJson(doc)))
      res.json(doc ? fbr.payment.paymentToJson(doc) : {err: err});
    }	
  });
}
function respondToFacebook(req, res) {
  var fbr = new FacebookAPIRequest(req);

console.log('FACEBOOK index params '+JSON.stringify(req.params)+" "+JSON.stringify(req.body)+" "+JSON.stringify(req.query))

  if (fbr.hasError()) {
    res.render('facebook/index', {errorDescription: fbr.error_description});
  } else if (fbr.isAuthenticating()) {
    authenticateUser(fbr);
  } else if (fbr.isPaying()) {
    processPayment(fbr, res);
  } else {
    res.render('facebook/index');
  };
}

routes = {
  index: respondToFacebook,
  create: respondToFacebook,
	
  new: function(req, res) {
    var fb = new client();
    var stateToken = req.session.id;
    var opts = {OAuthDialogUrl: fb.getOAuthDialogUrl(stateToken), layout: 'app/layouts/blank'};
    res.render('facebook/new', opts);
  },
}

Controller.prototype.Routes = routes;

module.exports = {
  Controller: Controller,
  Routes: Object.keys(Controller.prototype.Routes)
}