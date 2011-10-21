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
					
					setScroll();
					
					setViewSize();
					
					setEvents();
					
					setUpUI();
				};
				
				update();
				
				function setViewSize() {
					$this.find('.content').css('height',document.documentElement.clientHeight - resizeOffset);
					var titleWidth = $this.find('.feedTitle').width();
					var left = (document.documentElement.clientWidth - titleWidth) / 2;
					$this.find('.feedTitle').css('margin-left', left+'px');
				}
				
				function setScroll() {
					if (!!('ontouchstart' in window)) {
						$this.find('.content:first-child').touchScroll();
						$this.find('.content').unbind('touchScroll');
						$this.find('.content:first-child').bind('touchScroll', function(){
							determineRefresh();
						});
						$this.find('.content').unbind('touchEnd');
						$this.find('.content:first-child').bind('touchEnd', function(){
							doRefresh();
						});
					}
				}
				
				function determineRefresh() {
					var position = $this.find('.content:first-child').touchScroll('getPosition');
					if (position < -60) {
						$this.find('.refreshHeader').find('.refreshContent').html('Release to refresh...');
						rotateArrow(true);
					} else {
						$this.find('.refreshHeader').find('.refreshContent').html('Pull down to refresh...');
						rotateArrow();
					}
				}
				
				var degree = 0;
				
				function rotateArrow(up) {
					$this.find('.refreshHeader').find('.refreshArrow').css({ WebkitTransform: 'rotate(' + degree + 'deg)'});
			        $this.find('.refreshHeader').find('.refreshArrow').css({ '-moz-transform': 'rotate(' + degree + 'deg)'});
			        if (up) {
			        	if (degree < 180) {
			        		degree += 20;
			        		setTimeout(function() { rotateArrow(true); },100);
			        	}
			        } else {
			        	if (degree > 0) {
			        		degree -= 20;
			        		setTimeout(function() { rotateArrow(); },100);
			        	}
			        }
				}
				
				function doRefresh() {
					var position = $this.find('.content:first-child').touchScroll('getPosition');
					if (!o.reloading) {
						if (position < -60) {
							o.reloading = true;
							$this.find('.refreshHeader').find('.refreshContent').html('Loading...');
							$this.find('.content').touchScroll('setRestPosition', 50);
							//getSingleEvent();
						}
					}
				}
				
				function resetScroll() {
					if (!!('ontouchstart' in window)) {
						$this.find('.content').touchScroll('setPosition', 0);
					}
				}
				
				function setEvents() {
					$this.find('.closeButton').unbind('click');
					$this.find('.closeButton').click(function() {
						ViewController.getInstance().hideMessages();
					});
				}
				
				function setUpUI() {
					$this.find('.content').html('');
					//$this.find('.content').append('<div class="refreshHeader dark"><div class="refreshArrow"></div><div class="refreshContent">Pull down to refresh...</div></div>');
					$this.find('.content').append('<ul class="messageList">');
					for (var i=o.event.allMessages.length-1; i>=0; i--) {
						var m = o.event.allMessages[i];
						var sender;
						var imageTag;
						var message;
						if (m.type == "decided") {
							imageTag = '<img class="decided" src="/assets/images/POIs_decided_default_sm.png" />';
							sender = '<span class="sender">Weego</span><br />';
							message = '<span class="message">"'+ o.event.getWinningLocation().name +'" is where we are going!</span>';
						} else {
							var p = o.event.getParticipantById(m.senderId);
							imageTag = '<img src="'+ p.avatarURL +'" />';
							sender = '<span class="sender">'+ p.getFullName() +'</span><br />';
							message = '<span class="message">'+ m.message +'</span>';
						}
						var html = 	'<li>';
						html +=			imageTag;
						html +=			sender;
						html +=			message;
						html +=		'</li>';
						$this.find('.content').find('.messageList').append(html);
					}
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