var baseController = require('./app').Controller;
var client = require('../lib/facebook/client');
var Item = require('./../models/item').Model;

var FacebookPaymentRequest = function(req) {
  this.buyer = req.params.buyer;
  this.receiver = req.params.receiver;
  this.order_id = req.params.order_id;
  this.order_info = req.params.order_info;
  this.method = req.params.method;
}
FacebookPaymentRequest.prototype.itemToJson = function itemToJson(doc) {
  return {
    content:[
      {
        "title": doc.facebook.title,
        "price": doc.facebook.price,
        "description": doc.facebook.description,
        "item_id": doc.facebook.item_id,
        "image_url": "apple-touch-icon.png",
        "product_url": "apple-touch-icon.png"
      }
   ],
   method:"payments_get_items"
  }
}
FacebookPaymentRequest.prototype.isRequestingItem = function isRequestingItem() {
  return this.method === 'payments_get_items';
}
FacebookPaymentRequest.prototype.isCompletingPurchase = function isCompletingPurchase() {
  return this.method === 'payments_status_update';
}
FacebookPaymentRequest.prototype.findItem = function findItem(callback) {
  var query = {_id: this.order_id};
  Item.findOne(query, callback);
}

var FacebookAPIRequest = function(req) {
  this.error = req.params.access_denied;
  this.error_description = req.params.error_description;
  this.code = req.params.code;

  if (req.params.method) {
    this.payment = new FacebookPaymentRequest(req);
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
  if (fbr.payment.isRequestingItem()) {
    fbr.payment.findItem(function(err, doc) {
      res.json(doc ? fbr.payment.itemToJson(doc) : {err: err});
    })
  } else if (fbr.payment.isCompletingPurchase()) {
  }
}

routes = {
  index: function(req, res) {
    var fbr = new FacebookAPIRequest(req);
console.log('FACEBOOK index params '+JSON.stringify(req.params))

    if (fbr.hasError()) {
      res.render('facebook/index', {errorDescription: fbr.error_description});
    } else if (fbr.isAuthenticating()) {
      authenticateUser(fbr);
    } else if (fbr.isPaying()) {
      processPayment(fbr, res);
    } else {
      res.render('facebook/index');
    };
  },
	
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