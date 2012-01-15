(function ($) {

  $(document).ready(function() {
    function purchaseItem(e) {
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
	        click: function () {},
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

	$('#bazaar li a').live('click', purchaseItem);
  })
})(jQuery);