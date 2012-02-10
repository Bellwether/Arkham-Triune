var ex = require('express');
var path = require('path');
var publicRoot = path.normalize(__dirname + '../../../public/');

var assetManager = require('connect-assetmanager');
var assetManagerGroups = {
  'js': {
    'route': /\/js\/[0-9]+\/minified\.js/,
    'path': publicRoot+'js/',
    'dataType': 'javascript',
    'files': [
      'app.js',
      'map.js',
      'store.js',
      'animation.js'
    ]
  },
  'css': {
    'route': /\/css\/[0-9]+\/minified\.css/,
    'path': publicRoot+'css/',
    'dataType': 'css',
    'files': [
      'reset.css',
      'jquery.mobile.css',
      'layout.css',
      'map.css'
    ]
  }
};

exports.init = function(app) {
  function developmentConfig() {
    assetManagerGroups['js']['debug'] = true;
    assetManagerGroups['css']['debug'] = false;

    assetManagerGroups['js']['files'].splice(0,0,'jquery.js');
    assetManagerGroups['js']['files'].splice(2,0,'jquery.mobile.js');
    assetManagerGroups['js']['files'].splice(3,0,'jquery.mobile.simpledialog.js');
	
    assetManagerGroups['css']['files'].splice(2,0,'jquery.mobile.simpledialog.css');	
      
  }
  function productionConfig() {
	assetManagerGroups['js']['debug'] = false;
	assetManagerGroups['css']['debug'] = false;
	
    assetManagerGroups['js']['files'].splice(0,0,'jquery.js');
    assetManagerGroups['js']['files'].splice(1,0,'jquery.mobile.js');
    assetManagerGroups['js']['files'].splice(2,0,'jquery.mobile.simpledialog.js');

    assetManagerGroups['css']['files'].splice(2,0,'jquery.mobile.simpledialog.css');
  }
  	
  app.configure('development', developmentConfig);
  app.configure('production', productionConfig);
	
  app.use(ex.favicon(publicRoot + '/favicon.ico'));
  app.use(assetManager(assetManagerGroups));
  app.use(ex.static(publicRoot));
};