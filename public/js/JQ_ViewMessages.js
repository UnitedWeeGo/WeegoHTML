(function($) {
	
	var defaults = {
			event: null
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
					
					setViewSize();
					
					setEvents();
				};
				
				update();
				
				function setViewSize() {
					$this.find('.content').css('height',document.documentElement.clientHeight - resizeOffset);
				}
				
				function setEvents() {
					$this.find('#locationSearch').find('#submit').unbind('click');
					$this.find('#locationSearch').find('#submit').click(function() {
						searchSimpleGeo();
					});
				}
			});
		},		
	};
	
	$.fn.messages = function(method) {
	    if (methods[method]) {
			return methods[method].apply(this, Array.prototype.slice.call(arguments, 1));
		} else if (typeof method === 'object' || !method) {
			return methods.init.apply(this, arguments);
		} else {
			$.error('Method ' +  method + ' does not exist on jQuery.messages');
		}
	};

})(jQuery);