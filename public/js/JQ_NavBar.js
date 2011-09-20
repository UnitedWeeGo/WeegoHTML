(function($) {
	
	var defaults = {
		state: {home:100, dashboard:200, prefs:300, eventDetail:400, addLocations:500, createEvent:600}
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
						setTitleCenter();
					});
				};
				
				update();
				
				function setTitleCenter() {
					$this.find('.weegoTitle').css('width',document.documentElement.clientWidth - 116);
				}
				
				var setNav = this.setNav = function setNav(state) {
					$this.html('');
					$this.removeClass('home');
					$this.removeClass('event');
					switch (state) {
						case o.state.home :
							$this.addClass('home');
							break;
						case o.state.dashboard :
							$this.addClass('home');
							$this.append('<div class="prefsButton"><img src="/assets/images/icon_settings_01.png" /></div>');
							$this.append('<div class="weegoTitle"><img src="/assets/images/topbar_logotype.png" /></div>');
							//$this.append('<div class="addButton"><img src="/assets/images/icon_plus_01.png" /></div>');
							break;
						case o.state.prefs :
							$this.addClass('home');
							break;
						case o.state.eventDetail :
							$this.addClass('event');
							$this.append('<div class="backButton"><img src="/assets/images/icon_home_01.png" /></div>');
							$this.append('<div class="weegoTitle">Event Details</div>');
							break;
							
						case o.state.createEvent :
							$this.addClass('event');
							$this.append('<div class="backButton"><img src="/assets/images/icon_home_01.png" /></div>');
							$this.append('<div class="weegoTitle">Create Event</div>');
							$this.append('<div class="doneButton">Done</div>');
							break;
					}
					setTitleCenter();
				}
				
			});
		},
		
		home: function() {
			methods.init.apply(this, arguments);
			return this.each(function() {
				this.setNav(defaults.state.home);
			});
		},
		
		dashboard: function() {
			methods.init.apply(this, arguments);
			return this.each(function() {
				this.setNav(defaults.state.dashboard);
			});
		},
		
		eventDetail: function() {
			methods.init.apply(this, arguments);
			return this.each(function() {
				this.setNav(defaults.state.eventDetail);
			});
		},
		
		createEvent: function() {
			methods.init.apply(this, arguments);
			return this.each(function() {
				this.setNav(defaults.state.createEvent);
			});
		},
		
	};
	
	$.fn.navBar = function(method) {
	    if (methods[method]) {
			return methods[method].apply(this, Array.prototype.slice.call(arguments, 1));
		} else if (typeof method === 'object' || !method) {
			return methods.init.apply(this, arguments);
		} else {
			$.error('Method ' +  method + ' does not exist on NavBar');
		}
	};

})(jQuery);