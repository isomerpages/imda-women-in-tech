(function ($) {
    $(document).ready(function () {
	 
	 $(".scroll-top").click(function() {
        $("html, body").animate({ 
            scrollTop: 0 
        }, "slow");
        return false;
    });
	// Scroll Top End
	$('#myCarousel').carousel({
	  pause: true,
      interval: false
	}); 
   // Banner Slider End
   
	$('[data-toggle=search-form]').click(function() {
			$('.search-form-wrapper').toggleClass('open');
			$('.search-form-wrapper .search').focus();
			$('html').toggleClass('search-form-open');
		  });
		  $('[data-toggle=search-form-close]').click(function() {
			$('.search-form-wrapper').removeClass('open');
			$('html').removeClass('search-form-open');
		  });
		$('.search-form-wrapper .search').keypress(function( event ) {
		  if($(this).val() == "Search") $(this).val("");
		});

		$('.search-close').click(function(event) {
		  $('.search-form-wrapper').removeClass('open');
		  $('html').removeClass('search-form-open');
		});
		});
	// Navigation Search End
})(jQuery);


(function ($) {
    var body = $('body'),
        win = $(window);
    var scrollTofixNav = function (obj) {
        if ($(obj).length > 0) {
            var getObjH = $(obj).outerHeight()/2; 
            win.on('scroll', function () {
                var winST = win.scrollTop();
                if (winST >= 50) {
                    $(obj).addClass('scroll-fixed');
                } else {
                    $(obj).removeClass('scroll-fixed');
                }
            });
        }
    }
	// Add Backdrop Start
    var navBarOpen = function () {
        var hamburger = $('.navbar-toggler'),
            backDrop = $('.backdrop');
        if (hamburger.length > 0) {
            hamburger.on('click', function () {
                backDrop.toggleClass('d-block');
            });
        }
    }
	navBarOpen();
	// Add Backdrop End
	
	  $(window).on('load resize', function () {
        if (win.width() >= 1024) {
            scrollTofixNav('.header-navbar');
        } else {
            scrollTofixNav('.navbar-logo');
        }
    });

})(jQuery);


