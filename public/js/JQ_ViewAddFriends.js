(function($) {
	
	var defaults = {
			event: null,
			facebook: null,
			recents: null
	};
	
	var methods = {
		
		init: function(options) {
			return this.each(function() {
				
				var o = $.extend(defaults, options);
				
				o.facebook = new Array();
				o.recents = new Array();
				
				if (!!this._init) {
					return this.update();
				}
				this._init = true;
				
				var $this = $(this);
				
				var update = this.update = function() {
					$(window).resize(function() {
						setViewSize();
					});
					
					getFriends();
					
					setEvents();
					setViewSize();
					//setScroll();
					//setUpUI();
					//resetScroll();
				};
				
				update();
				
				function getFriends() {
					var url = domain + "/get.participantinfo.php";
					$.get(url, {registeredId:ruid}, function(data) {
						handleGetFriendsResponse(data);
					});
				}
				
				function handleGetFriendsResponse(data) {
					var allParticipantsXML = $(data).find('participant');
					for (var i=0; i<allParticipantsXML.length; i++) {
						var pXML = allParticipantsXML[i];
						var p = new Participant();
						p.populateWithXML(pXML);
						if (p.type == "facebook" && !o.event.getParticipantById(p.email)) {
							o.facebook.push(p);
						} else if (p.type == "recent" && !o.event.getParticipantById(p.email)) {
							o.recents.push(p);
						}
					}
					setUpUI();
				}
				
				function setViewSize() {
					$this.find('.content').css('height', document.documentElement.clientHeight - resizeOffset);
				}
				
				function setScroll() {
					if (!!('ontouchstart' in window)) {
						$this.find('.content:first-child').touchScroll();
					}
				}
				
				function resetScroll() {
					if (!!('ontouchstart' in window)) {
						$this.find('.contentContainer').find('.content:first-child').touchScroll('setPosition', 0);
					}
				}
				
				function getSingleEvent() {
					var url = domain + "/get.event.php";
					var params = {registeredId:ruid, eventId:o.eventId};
					if (o.event && o.event.lastUpdatedTimestamp) params.timestamp = o.event.lastUpdatedTimestamp;
					$.get(url, params, function(data) {
						handleGetSingleEvent(data);
						setUpUI();
						//ViewController.getInstance().showEventDetail(o.event.eventId, false, o.event.showCountMeIn(), true);
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
						$this.find('.content').touchScroll('setPosition', 0);
					}
				}
				
				function setEvents() {
					
				}
				
				function setUpUI() {
					$this.find('.content').html('');
					$this.find('.content').append('<ul class="participantList">');
					if (o.recents.length > 0) {
						$this.find('.content').find('.participantList').append('<li class="header"><span class="headerText">Recent</span></li>');
						for (var i=0; i<o.recents.length; i++) {
							var p = o.recents[i];
							$this.find('.content').find('.participantList').append(p.displayForEventDetail());
						}
					}
					if (o.facebook.length > 0) {
						$this.find('.content').find('.participantList').append('<li class="header"><span class="headerText">Facebook friends on weego</span></li>');
						for (var i=0; i<o.facebook.length; i++) {
							var p = o.facebook[i];
							$this.find('.content').find('.participantList').append(p.displayForEventDetail());
						}
					}
					
					setViewSize();
					setScroll();
				}
				
			});
		},		
	};
	
	$.fn.addFriends = function(method) {
	    if (methods[method]) {
			return methods[method].apply(this, Array.prototype.slice.call(arguments, 1));
		} else if (typeof method === 'object' || !method) {
			return methods.init.apply(this, arguments);
		} else {
			$.error('Method ' +  method + ' does not exist on jQuery.addFriends');
		}
	};

})(jQuery);