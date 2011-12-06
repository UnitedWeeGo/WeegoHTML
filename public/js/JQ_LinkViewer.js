(function($) {
	
	var defaults = {
		url: null
	};
	
	var methods = {
		
		init: function(options) {
			return this.each(function() {
				
				var o = $.extend(defaults, options);
				
				if (!!this._init) {
					return this.update();
				}
				this._init = true;
				
				var $this = $(this);
				
				var update = this.update = function() {
					$(window).resize(function() {
						setViewSize();
					});
					setUpUI();
				};
				
				update();
				
				function setViewSize() {
					$this.find('.content').css('height',document.documentElement.clientHeight - resizeOffset);
				}
				
				function setScroll(reset) {
					if (!!('ontouchstart' in window)) {
						$this.find('.content').find('IFRAME').touchScroll();
					}
				}
				
				function setUpUI() {
					$this.find('.content').html('');
					$this.find('.content').append('<iframe src="'+ o.url +'" scrolling="yes" />');
					$this.find('.content').scrollTop(20);
					$this.find('.content').find('IFRAME').scroll(function(){
						console.log($(this).scrollTop());
					});
				}
				
			});
		}		
	};
	
	$.fn.linkViewer = function(method) {
	    if (methods[method]) {
			return methods[method].apply(this, Array.prototype.slice.call(arguments, 1));
		} else if (typeof method === 'object' || !method) {
			return methods.init.apply(this, arguments);
		} else {
			$.error('Method ' +  method + ' does not exist on linkViewer');
		}
	};

})(jQuery);