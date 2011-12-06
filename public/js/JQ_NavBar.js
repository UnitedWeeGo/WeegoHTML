(function($) {
	
	var defaults = {
		state: {home:100, dashboard:200, prefs:300, eventDetail:400, eventDetailCountMeIn:401, addLocations:500, createEvent:600, addFriends:700, yelpReview:800, editLocationName:900, terms:1000, privacy:1100}
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
					$this.find('.weegoTitle').css('width',document.documentElement.clientWidth - 126);
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
							$this.append('<div class="weegoTitle"><div class="titleText"><img src="/assets/images/topbar_logotype.png" /></div></div>');
							$this.append('<div class="addButton"><img src="/assets/images/icon_plus_01.png" /></div>');
							break;
						case o.state.prefs :
							$this.addClass('home');
							$this.append('<div class="backButton"><img src="/assets/images/icon_home_white.png" /></div>');
							$this.append('<div class="weegoTitle"><div class="titleText">Settings</div></div>');
							break;
						case o.state.eventDetail :
							$this.addClass('event');
							$this.append('<div class="backButton"><img src="/assets/images/icon_home_01.png" /></div>');
							$this.append('<div class="weegoTitle"><div class="titleText">Event Details</div></div>');
							$this.append('<div class="moreButton"><img src="/assets/images/icon_more_01.png" /></div>');
							$(this).find(".moreButton").unbind('click');
							$(this).find(".moreButton").click(function() {
								moreButtonClick();
							});
							break;
						case o.state.eventDetailCountMeIn :
							$this.addClass('event');
							$this.append('<div class="backButton"><img src="/assets/images/icon_home_01.png" /></div>');
							$this.append('<div class="weegoTitle"><div class="countMeInButton">Count me in!</div></div>');
							$this.append('<div class="moreButton"><img src="/assets/images/icon_more_01.png" /></div>');
							$(this).find(".moreButton").unbind('click');
							$(this).find(".moreButton").click(function() {
								moreButtonClick();
							});
							$(this).find(".countMeInButton").unbind('click');
							$(this).find(".countMeInButton").click(function() {
								countMeInClick();
							});
							break;
						case o.state.createEvent :
							$this.addClass('event');
							$this.append('<div class="cancelButton">Cancel</div>');
							$this.append('<div class="weegoTitle"><div class="titleText">Create Event</div></div>');
							$this.append('<div class="doneButton">Done</div>');
							break;
						case o.state.addLocations :
							$this.addClass('event');
							$this.append('<div class="backButton arrow"><img src="/assets/images/icon_backArrow_dark_01.png" /></div>');
							$this.append('<div class="weegoTitle"><div class="titleText yelp"><img src="/assets/images/logo_yelp.png" /></div></div>');
							break;
						case o.state.addFriends :
							$this.addClass('event');
							$this.append('<div class="backButton arrow"><img src="/assets/images/icon_backArrow_dark_01.png" /></div>');
							$this.append('<div class="weegoTitle"><div class="titleText">Add Friends</div></div>');
							$this.append('<div class="doneButton">Done</div>');
							break;
						case o.state.yelpReview :
							$this.addClass('event');
							$this.append('<div class="backButton arrow"><img src="/assets/images/icon_backArrow_dark_01.png" /></div>');
							$this.append('<div class="weegoTitle"><div class="titleText yelp"><img src="/assets/images/logo_yelp.png" /></div></div>');
							break;
						case o.state.editLocationName :
							$this.addClass('event');
							$this.append('<div class="cancelButton">Cancel</div>');
							$this.append('<div class="weegoTitle"><div class="titleText">Edit Location Name</div></div>');
							$this.append('<div class="doneButton">Done</div>');
							$(this).find(".cancelButton").unbind('click');
							$(this).find(".cancelButton").click(function() {
								cancelEditButtonClick();
							});
							$(this).find(".doneButton").unbind('click');
							$(this).find(".doneButton").click(function() {
								doneEditButtonClick();
							});
							break;
						case o.state.terms :
							$this.addClass('event');
							$this.append('<div class="backButton arrow"><img src="/assets/images/icon_backArrow_dark_01.png" /></div>');
							$this.append('<div class="weegoTitle"><div class="titleText">Terms</div></div>');
							break;
						case o.state.privacy :
							$this.addClass('event');
							$this.append('<div class="backButton arrow"><img src="/assets/images/icon_backArrow_dark_01.png" /></div>');
							$this.append('<div class="weegoTitle"><div class="titleText">Privacy Policy</div></div>');
							break;
					}
					setTitleCenter();
				}
				
				function countMeInClick() {
					$(window).trigger('countMeInClick');
				}
				
				function moreButtonClick() {
					$(window).trigger('moreButtonClick');
				}
				
				function cancelEditButtonClick() {
					$(window).trigger('cancelEditButtonClick');
				}
				
				function doneEditButtonClick() {
					$(window).trigger('doneEditButtonClick');
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
		
		eventDetailCountMeIn: function() {
			methods.init.apply(this, arguments);
			return this.each(function() {
				this.setNav(defaults.state.eventDetailCountMeIn);
			});
		},
		
		createEvent: function() {
			methods.init.apply(this, arguments);
			return this.each(function() {
				this.setNav(defaults.state.createEvent);
			});
		},
		
		addLocations: function() {
			methods.init.apply(this, arguments);
			return this.each(function() {
				this.setNav(defaults.state.addLocations);
			});
		},
		
		addFriends: function() {
			methods.init.apply(this, arguments);
			return this.each(function() {
				this.setNav(defaults.state.addFriends);
			});
		},
		
		prefs: function() {
			methods.init.apply(this, arguments);
			return this.each(function() {
				this.setNav(defaults.state.prefs);
			});
		},
		
		yelpReview: function() {
			methods.init.apply(this, arguments);
			return this.each(function() {
				this.setNav(defaults.state.yelpReview);
			});
		},
		
		editLocationName: function() {
			methods.init.apply(this, arguments);
			return this.each(function() {
				this.setNav(defaults.state.editLocationName);
			});
		},
		
		terms: function() {
			methods.init.apply(this, arguments);
			return this.each(function() {
				this.setNav(defaults.state.terms);
			});
		},
		
		privacy: function() {
			methods.init.apply(this, arguments);
			return this.each(function() {
				this.setNav(defaults.state.privacy);
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