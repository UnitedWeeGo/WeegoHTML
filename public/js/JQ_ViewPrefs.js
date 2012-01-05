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
					
					$this.find('.content').append('<ul class="collapseableList controlList">');
					$this.find('.content').find('.controlList').append('<li class="autoLocation"><div class="toggle"><div class="on">ON</div><div class="off">OFF</div></div><h3>Display my location</h3>');
					$this.find('.content').find('.controlList').append('<li class="autoCheckin"><div class="toggle"><div class="on">ON</div><div class="off">OFF</div></div><h3>Auto-checkin</h3>');
					$this.find('.content').find('.controlList').find('.autoLocation').unbind('click');
					$this.find('.content').find('.controlList').find('.autoLocation').click(function(){
						if ($(this).hasClass('on')) {
							$(this).removeClass('on');
							setCanAutoReportLocation(false);
						} else {
							$(this).addClass('on');
							setCanAutoReportLocation(true);
						}
					});
					if (canAutoReportLocation) {
						$this.find('.content').find('.controlList').find('.autoLocation').addClass('on');
					}
					
					$this.find('.content').find('.controlList').find('.autoCheckin').unbind('click');
					$this.find('.content').find('.controlList').find('.autoCheckin').click(function(){
						if ($(this).hasClass('on')) {
							$(this).removeClass('on');
							setCanAutoCheckin(false);
						} else {
							$(this).addClass('on');
							setCanAutoCheckin(true);
						}
					});
					if (canAutoCheckin) {
						$this.find('.content').find('.controlList').find('.autoCheckin').addClass('on');
					}
					
					$this.find('.content').append('<ul class="collapseableList legalLinksList">');
					$this.find('.content').find('.legalLinksList').append('<li class="terms"><h3>Terms</h3>');
					$this.find('.content').find('.legalLinksList').append('<li class="privacy"><h3>Privacy Policy</h3>');
					$this.find('.content').find('.legalLinksList').find('.terms').unbind('click');
					$this.find('.content').find('.legalLinksList').find('.terms').click(function(){
						ViewController.getInstance().showLinkViewer('terms');
					});
					
					$this.find('.content').find('.legalLinksList').find('.privacy').unbind('click');
					$this.find('.content').find('.legalLinksList').find('.privacy').click(function(){
						ViewController.getInstance().showLinkViewer('privacy');
					});
					
					$this.find('.content').append('<div class="fbButton"><div class="text">Logout</div></div>');
					$this.find('.content').find('.fbButton').bind('click', function() {
						ruid = null;
						Model.getInstance().clear();
						$.cookie('ruid',null);
						$.cookie({'canAutoCheckin': null});
						canAutoCheckin = null;
						$.cookie({'canAutoReportLocation': null});
						canAutoReportLocation = null;
						if (!window.Android) {
							try {
								FB.logout(function(response) {
									ViewController.getInstance().showView(Model.appState.login, null);
								});
							} catch (e) {
								window.location.reload();
							}
						} else {
							reportLogoutToWrapper();
							ViewController.getInstance().showView(Model.appState.login, null);
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