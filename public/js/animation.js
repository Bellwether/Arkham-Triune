(function ($) {
  $.SFX = function(options) {
    options = options || {};

    function setVendorProperty(elem, prop, val) {	
      $(elem).css('-webkit-' + prop, val);	
      $(elem).css('-moz-' + prop, val);
      $(elem).css('-ms-' + prop, val);
      $(elem).css('-o-' + prop, val);
      $(elem).css(prop, val);
    };	
	
    return {
      transfer: function(source, destination, callback) {
        var transferable = source.clone();
        var css = {position: 'absolute', height: 'inherit', width: 'inherit', zIndex: 1000};
        transferable.css(css);
        var dx = destination.offset().left - source.offset().left;
        var dy = destination.offset().top - source.offset().top;

        var pixelsPerSecond = options.speed || 250;
        var pixelDistance = Math.floor(Math.sqrt(Math.pow(dx, 2) + Math.pow(dy, 2)));
        var duration = (pixelDistance / pixelsPerSecond) * 1000;
        function onComplete() {
          transferable.remove();
          if (typeof callback === 'function') callback();
        }

        var animation = {marginTop: dy, marginLeft: dx};
        transferable.prependTo(source.parent()).animate(animation, {
          duration: duration,
          complete: onComplete
        });
      }
    }
  }
})(jQuery);