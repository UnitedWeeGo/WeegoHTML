(function($) {
	
	var defaults = {
			event: null,
			reloading: false
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
					
					markRead();
					
					setEvents();
					
					setViewSize();
					
					setScroll();
					
					o.reloading = false;
					degree = 0;
					if (!!('ontouchstart' in window)) {
						$this.find('.content').touchScroll('setRestPosition', 0);
					}
					
					setUpUI();
					
					setUpMessageInput();
					
					resetScroll();
				};
				
				update();
				
				function markRead() {
					var url = domain + "/readall.feedmessages.php";
					$.get(url, {registeredId:ruid, eventId:o.event.eventId}, function(data) {
					
					});
				}
				
				function setViewSize() {
					var messageInputHeight = ($this.find('.messageInput')) ? $this.find('.messageInput').outerHeight() : 0;
					$this.find('.contentContainer').css('height',document.documentElement.clientHeight - resizeOffset - messageInputHeight + 1); // one pixel adjustment for bottom of scrolling list
					$this.find('.content').css('height', (document.documentElement.clientHeight - resizeOffset - messageInputHeight) + 600 + 9);
					$this.find('.messageInput').find('TEXTAREA').css('width',document.documentElement.clientWidth - 18);
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
				
				function resetScroll() {
					if (!!('ontouchstart' in window)) {
						$this.find('.contentContainer').find('.content:first-child').touchScroll('setPosition', 0);
					}
				}
				
				function determineRefresh() {
					var position = $this.find('.contentContainer').find('.content:first-child').touchScroll('getPosition');
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
					var position = $this.find('.contentContainer').find('.content:first-child').touchScroll('getPosition');
					if (!o.reloading) {
						if (position < -60) {
							o.reloading = true;
							$this.find('.refreshHeader').find('.refreshContent').html('Loading...');
							$this.find('.content').touchScroll('setRestPosition', 50);
							getSingleEvent();
						}
					}
				}
				
				function getSingleEvent() {
					var url = domain + "/get.event.php";
					var params = {registeredId:ruid, eventId:o.eventId};
					if (o.event && o.event.lastUpdatedTimestamp) params.timestamp = o.event.lastUpdatedTimestamp;
					$.get(url, params, function(data) {
						handleGetSingleEvent(data);
						markRead();
						setUpUI();
					});
				}

				function handleGetSingleEvent(data) {
					Model.getInstance().populateEventsWithXML(data);
					o.lastUpdatedTimestamp = $(data).find('response').attr('timestamp');
					var allEventsXML = $(data).find('event');
					for (var i=0; i<allEventsXML.length; i++) {
						var evXML = allEventsXML[i];
						var id = $(evXML).attr('id');
						o.event = Model.getInstance().getEventById(id); // new Event();
						o.event.lastUpdatedTimestamp = $(data).find('response').attr('timestamp');
						o.event.populateWithXML(evXML);
					}
					o.reloading = false;
					degree = 0;
					if (!!('ontouchstart' in window)) {
						$this.find('.content').touchScroll('setRestPosition', 0);
					}
					Model.getInstance().currentEvent = o.event;
					Model.getInstance().getModelDataAsJSON();
				}
				
				function resetScroll() {
					if (!!('ontouchstart' in window)) {
						$this.find('.contentContainer').find('.content').touchScroll('setPosition', 0);
					}
				}
				
				function setEvents() {
					$this.find('.closeButton').unbind('click');
					$this.find('.closeButton').click(function() {
						ViewController.getInstance().hideMessages();
					});
					$this.find('.sendButton').unbind('click');
					$this.find('.sendButton').click(function() {
						sendMessage();
					});
					
					$this.find('.cta').find('TEXTAREA').focusin(function(){
						showActiveInput();
					});
				}
				
				function showActiveInput() {
					$this.find('.messageInput').find('.cta').css('display', 'none');
					$this.find('.messageInput').find('.activeInput').css('display', 'block');
					$this.find('.messageInput').find('.activeInput').find('TEXTAREA').focus();
					setViewSize();
					setScroll();
				}
				
				function hideActiveInput() {
					$this.find('.messageInput').find('.cta').css('display', 'block');
					$this.find('.messageInput').find('.activeInput').css('display', 'none');
					setViewSize();
					setScroll();
				}
				
				function sendMessage() {
					var text = $this.find('.messageInput').find('.activeInput').find('TEXTAREA').val();
					var woWhiteSpace = text.replace(/ /g,'');
					if (woWhiteSpace.length > 0) {
						var now = new Date();
						var url = domain + "/mod.feedmessage.php";
						$.get(url, {registeredId:ruid, eventId:o.event.eventId, message:escape(text)}, function(data) { //, timestamp:now.format('yyyy-m-dd h:MM:ss')
							handleSendMessageResponse(data);
						});
					}
				}
				
				function handleSendMessageResponse(data) {
					Model.getInstance().populateEventsWithXML(data);
					$this.find('.messageInput').find('.activeInput').find('TEXTAREA').val('');
					updateChars();
					setUpUI();
					hideActiveInput();
				}
				
				function setUpUI() {
					$this.find('.content').html('');
					$this.find('.content').append('<div class="refreshHeader dark"><div class="refreshArrow"></div><div class="refreshContent">Pull down to refresh...</div></div>');
					$this.find('.content').append('<ul class="messageList">');
					for (var i=o.event.allMessages.length-1; i>=0; i--) {
						var m = o.event.allMessages[i];
						var sender;
						var imageTag;
						var message;
						var status;
						if (m.type == "decided") {
							imageTag = 	'<img class="decided" src="/assets/images/POIs_decided_default_sm.png" />';
							sender = 	'<span class="sender">Weego</span><br />';
							message = 	'<span class="message">"'+ unescape(o.event.getWinningLocation().name) +'" is where we are going!</span>';
							status = 	'<div class="statusBlock">';
							if (!m.userReadMessage) status += '<div class="newIcon"><img src="/assets/images/icon_feed_new.png" /></div>';
							status += 		'<div class="status">'+ m.getFriendlyTimestamp() +'</div>';
							status += 	'</div>';
						} else if (m.type == "timesuggestion") {
							var p = o.event.getParticipantById(m.senderId);
							imageTag = 	'<img class="avatar" src="'+ p.avatarURL +'" />';
							sender = 	'<span class="sender">'+ unescape(p.getFullName()) +'</span><br />';
							var newTime = m.getDateFromString(m.message);
							var adjustedTime = new Date(newTime.getTime() - (newTime.getTimezoneOffset() * 60 * 1000));
							message = 	'<span class="message">Suggests '+ adjustedTime.format("mmmm dd 'at' h:MM TT") +' as an alternate event time.</span>';
							status = 	'<div class="statusBlock">';
							if (!m.userReadMessage) status += '<div class="newIcon"><img src="/assets/images/icon_feed_new.png" /></div>';
							status += 		'<div class="status">'+ m.getFriendlyTimestamp() +'</div>';
							status += 	'</div>';
						} else {
							var p = o.event.getParticipantById(m.senderId);
							imageTag = 	'<img class="avatar" src="'+ p.avatarURL +'" />';
							sender = 	'<span class="sender">'+ unescape(p.getFullName()) +'</span><br />';
							message = 	'<span class="message">'+ unescape(m.message) +'</span>';
							status = 	'<div class="statusBlock">';
							if (!m.userReadMessage) status += '<div class="newIcon"><img src="/assets/images/icon_feed_new.png" /></div>';
							status += 		'<div class="status">'+ m.getFriendlyTimestamp() +'</div>';
							if (m.type == "locationadd") {
								status +=	'<div class="statusIcon"><img src="/assets/images/icon_feed_places.png" /></div>';
							} else if (m.type == "timechange") {
								status +=	'<div class="statusIcon"><img src="/assets/images/icon_feed_time_01.png" /></div>';
							} else if (m.type == "invite") {
								status +=	'<div class="statusIcon"><img src="/assets/images/icon_feed_people.png" /></div>';
							} else if (m.type == "checkin") {
								status +=	'<div class="statusIcon"><img src="/assets/images/icon_feed_checkin.png" /></div>';
							}
							status += 	'</div>';
						}
						var html = 	'<li>';
						html +=			status;
						html +=			imageTag;
						html +=			sender;
						html +=			message;
						html +=		'</li>';
						$this.find('.content').find('.messageList').append(html);
					}
					setViewSize();
					setScroll();
				}
				
				function setUpMessageInput() {
					$this.find('.messageInput').find('.activeInput').find('TEXTAREA').val('');
					updateChars();
					$this.find('.messageInput').find('.activeInput').find('TEXTAREA').keyup(function(){
						updateChars();
					});
				}
				
				function updateChars() {
					var text = $this.find('.messageInput').find('.activeInput').find('TEXTAREA').val();
					var charsAmt = 140;
					//if (text) {
						charsAmt -= text.length;
					//}
					$this.find('.chars').html(charsAmt);
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