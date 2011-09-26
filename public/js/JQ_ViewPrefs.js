(function($) {
	
	var defaults = {
		
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
					setScroll();
					setUpUI();
				};
				
				update();
				
				function setViewSize() {
					$this.find('.content').css('height',document.documentElement.clientHeight - resizeOffset);
				}
				
				function setScroll(reset) {
					if (!!('ontouchstart' in window)) {
						$this.find('.content').touchScroll();
					}
				}
				
				function setUpUI() {
					$this.find('.content').html('');
					$this.find('.content').append('<ul class="collapseableList participantList">');
					var p = Model.getInstance().loginParticipant;
					$this.find('.content').find('.participantList').append('<li><img src="'+ p.avatarURL +'"><h3>'+ p.getFullName() +'</h3>');
					$this.find('.content').append('<div class="fbButton"><div class="text">Logout</div></div>');
					$this.find('.content').find('.fbButton').bind('click', function() {
						ruid = null;
						Model.getInstance().clear();
						$.cookie('ruid',null);
						try {
							FB.logout(function(response) {
								ViewController.getInstance().showView(Model.appState.login, null);
							});
						} catch (e) {
							window.location.reload();
						}
					});
				}
				
			});
		}		
	};
	
	$.fn.prefs = function(method) {
	    if (methods[method]) {
			return methods[method].apply(this, Array.prototype.slice.call(arguments, 1));
		} else if (typeof method === 'object' || !method) {
			return methods.init.apply(this, arguments);
		} else {
			$.error('Method ' +  method + ' does not exist on Prefs');
		}
	};

})(jQuery);