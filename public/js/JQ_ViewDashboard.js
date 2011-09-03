(function($) {
	
	var defaults = {
		allEvents: new Array(),
		daysEvents: new Array(),
		futureEvents: new Array(),
		pastEvents: new Array()
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
					getDashboardEvents();
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
				
				function getDashboardEvents() {
					var url = domain + "/get.event.dashboard.php";
					$.get(url, {registeredId:ruid}, function(data) {
						handleGetDashboardEvents(data);
					});
				}
				
				function handleGetDashboardEvents(data) {
					var allEventsXML = $(data).find('event');
					o.allEvents = new Array();
					for (var i=0; i<allEventsXML.length; i++) {
						var evXML = allEventsXML[i];
						var ev = new Event();
						ev.populateWithXML(evXML);
						o.allEvents.push(ev);
					}
					sortEvents();
					setUpUI();
				}
				
				function sortEvents() {
					o.daysEvents = new Array();
					o.futureEvents = new Array();
					o.pastEvents = new Array();
					var sortedEvents = o.allEvents.sort(compareDates);
					var todayMidnight = new Date();
					todayMidnight.setHours(0);
					todayMidnight.setMinutes(0);
					todayMidnight.setSeconds(0);
					todayMidnight.setMilliseconds(0);
					
					for (var i=0; i<sortedEvents.length; i++) {
						var ev = sortedEvents[i];
						var adjustedDate = new Date(ev.eventDate - (ev.eventDate.getTimezoneOffset() * 60 * 1000));
						var dayDiff = (adjustedDate - todayMidnight) / (1000*60*60*24);
						if (dayDiff >= 0 && dayDiff <= 1) {
							var now = new Date();
							if (adjustedDate - now < -1000*60*60*3) {
								o.pastEvents.push(ev);
							} else o.daysEvents.push(ev);
						} else if (dayDiff > 1) {
							o.futureEvents.push(ev);
						} else {
							o.pastEvents.push(ev);
						}
					}
					o.pastEvents.reverse();
					if (o.daysEvents.length == 0 && o.futureEvents.length > 0) {
						o.daysEvents.push(o.futureEvents.shift());
					}
				}
				
				function compareDates(a,b) {
					var dateA = a.eventDate;
					var dateB = b.eventDate;
					return dateA - dateB;
				}
				
				function getEventById(id) {
					for (var i=0; i<o.allEvents.length; i++) {
						var ev = o.allEvents[i];
						if (ev.eventId == id) return ev;
					}
					return null;
				}
				
				function setUpUI() {
					var dashboard = $this;
					dashboard.find('.content').html('');
					if (o.daysEvents.length > 0) {
						dashboard.find('.content').append('<ul class="daysEventsList">');
						for (var i=0; i<o.daysEvents.length; i++) {
							var ev = o.daysEvents[i];
							dashboard.find('.daysEventsList').append(ev.displayForDashboardFull());
						}
					}
					if (o.futureEvents.length > 0) {
						dashboard.find('.content').append('<ul class="collapseableList futureEventsList">');
						dashboard.find('.futureEventsList').append('<li class="callToAction">Future Events</li>');
						for (var i=0; i<o.futureEvents.length; i++) {
							var ev = o.futureEvents[i];
							dashboard.find('.futureEventsList').append(ev.displayForDashboard());
						}
					}
					if (o.pastEvents.length > 0) {
						dashboard.find('.content').append('<ul class="collapseableList pastEventsList">');
						dashboard.find('.pastEventsList').append('<li class="callToAction">Past Events</li>');
						for (var i=0; i<o.pastEvents.length; i++) {
							var ev = o.pastEvents[i];
							dashboard.find('.pastEventsList').append(ev.displayForDashboard());
						}
					}
					dashboard.find('LI').each(function() {
						$(this).unbind('click');
						$(this).click(function() {
							handleEventCellClick($(this).attr("eventId"));
						});
					});
					$('.daysEventsList').find('LI').each(function() {
						var id = $(this).attr("eventId");
						var ev = getEventById(id);
						$(this).find(".voteButton").removeClass("iVotedFor");
						if (ev.didVoteForWinningLocation()) $(this).find(".voteButton").addClass("iVotedFor");
					});
					setViewSize();
					setScroll();
				}
				
				function handleEventCellClick(eventId) {
					ViewController.getInstance().showEventDetail(eventId, true);
				}
				
			});
		},		
	};
	
	$.fn.dashboard = function(method) {
	    if (methods[method]) {
			return methods[method].apply(this, Array.prototype.slice.call(arguments, 1));
		} else if (typeof method === 'object' || !method) {
			return methods.init.apply(this, arguments);
		} else {
			$.error('Method ' +  method + ' does not exist on jQuery.touchScroll');
		}
	};

})(jQuery);