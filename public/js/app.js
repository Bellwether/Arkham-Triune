$(document).ready(function() {
  function getQuerystringParam(key) {
    key = key.replace(/[\[]/, "\\\[").replace(/[\]]/, "\\\]");
    var searchString = "[\\?&]" + key + "=([^&#]*)";
    var regex = new RegExp(searchString);
    var results = regex.exec(window.location.href);
    return results === null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
  }	
  function getAuthData() {
    var facebookAuth = getQuerystringParam('signed_request');
    var data = {};
    if (facebookAuth) data.signed_request = facebookAuth;
    return data;
  }	

  $.sendRequest = function (options, callback) {
    var params = getAuthData();	
    var options = options || {};
    if (options.data) $.extend(params, (options.data || {}));
    var jqxhr = $.ajax({
      url: options.url,
      data: params,
      dataType: 'json',
      context: document.body,
      type: (options.method || 'PUT')
    })
    .always(function(data, jqXHR) {
      if (typeof callback === 'function') callback(data, jqXHR);
    })
    .fail(function(jqXHR, textStatus, errorThrown) {
    })
    .done(function(data, textStatus, jqXHR) {
    });
  }

});

$(document).bind('mobileinit', function() {
  $.mobile.defaultPageTransition = 'fade';
});

$('div[data-role="page"]').live('pagehide',function(event, ui) {
  $(this).remove();
});