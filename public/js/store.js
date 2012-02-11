(function ($) {

  $(document).ready(function() {
    function purchaseItem(e) {
	console.log('purchaseItem')
      e.preventDefault();

      var link = $(this);
      var itemName = link.children('h3').html();
      var wisdom = link.find('strong').html();

	  link.simpledialog({
	    'mode' : 'bool',
	    'prompt' : "Purchase a "+itemName+"?",
	    'subTitle': "Spend "+wisdom+" wisdom and immediately place this tile on your map.",
	    'useModal': true,
	    'buttons' : {
	      'Purchase': {
	        click: function () { link.unbind('click', purchaseItem).click(); console.log('buy') },
	        icon: "star"
	      },
	      'Cancel': {
            click: function () {},
	        icon: "delete",
	        theme: "c"
	      }
	    }
	  })
    }

    function showStore(e) {
      var link = $(this);
      var panelId = link.data('panel');

      $('.store:visible').fadeOut(200, function() {
        $('#'+panelId).fadeIn(200);
      });
    }

	$('.store li a').live('click', purchaseItem);
    $('.panel a').live('click', showStore);
  })
})(jQuery);