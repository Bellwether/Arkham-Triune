var fs = require('fs');
var path = require('path');
var log = require('util').log;

var CONTROLLER_PATH = path.normalize(__dirname + '../../../controllers')
var VIEW_PATH = path.normalize(__dirname + '../../../views')

function bootControllers(app) {
  log("SERVER loading controllers: "+CONTROLLER_PATH);

  fs.readdir(CONTROLLER_PATH, function(err, files) {
    if (err) throw err;
    files.forEach(function(file) {
	  var isValidFile = /.js$/.test(file);
      if (isValidFile) {
	    bootController(app, file);
	  };
    })
  });	
}

function bootController(app, file) {
  var controllerName = file.replace('.js', '');
  var handler = require(CONTROLLER_PATH+'/'+controllerName);
  var prefix = controllerName === 'app' ? '/' : ('/'+controllerName+'s');

  handler.Routes.map(function(action) {
    log("SERVER routing "+controllerName+"::"+action);

    function handleAction(req, res, next) {
      var controller = new handler.Controller(req, res, next);
      var actionTable = controller.Routes || controller.AppRoutes;
      var callback = actionTable[action];

      var self = this;
      var args = arguments;
      function onBeforeFilter() {
        req.params.controller = controllerName;
        req.params.action = action;

        callback.apply(self, args);
        controller.after_filter();	
      }

      controller.before_filter(req, res, onBeforeFilter);
    }
    routeAction(app, action, prefix, handleAction);
  });
}

function routeAction(app, action, prefix, callback) {
  switch(action) {
    case 'index':
      app.get(prefix + '.:format?', callback);
      break;
    case 'new':
      app.get(prefix + '/new', callback);
      break;	
    case 'show':
      app.get(prefix + '/:id.:format?', callback);
      break;
    case 'create':
      app.post(prefix, callback);
      break;
    case 'edit':
      app.get(prefix + '/:id/edit', callback);
      break;
    case 'end':
      app.get(prefix + '/:id/end', callback);
      break;
    case 'update':
      app.put(prefix + '/:id', callback);
      break;
    case 'destroy':
      app.del(prefix + '/:id', callback);
      break;
    default:
      app.get(prefix + '/' + action, callback);
      break;
  }	
}

exports.init = function(app) {
  app.use(app.router);
  bootControllers(app);

  app.set('views', VIEW_PATH);
};