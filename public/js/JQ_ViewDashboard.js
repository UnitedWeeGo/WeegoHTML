(function($) {
	
	var defaults = {
		allEvents: new Array(),
		daysEvents: new Array(),
		futureEvents: new Array(),
		pastEvents: new Array(),
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
					setViewSize();
					setScroll();
					getDashboardEvents();
				};
				
				update();
				
				function setViewSize() {
					$this.find('.content').css('height',document.documentElement.clientHeight - 1);
					$this.find('.refreshHeader').find('.refreshContent').css('width', document.documentElement.clientWidth - 74);
				}
				
				function setScroll(reset) {
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
					if (up) $this.find('.refreshHeader').find('.refreshArrow').addClass('up');
					else $this.find('.refreshHeader').find('.refreshArrow').removeClass('up');
					/*
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
			        */
				}
				
				function doRefresh() {
					var position = $this.find('.content:first-child').touchScroll('getPosition');
					if (!o.reloading) {
						if (position < -60) {
							o.reloading = true;
							$this.find('.refreshHeader').find('.refreshContent').html('Loading...');
							$this.find('.content').touchScroll('setRestPosition', 50);
							getDashboardEvents();
						}
					}
				}
				
				function getDashboardEvents() {
					var url = domain + "/get.event.dashboard.php";
					$.get(url, {registeredId:ruid}, function(data) {
						handleGetDashboardEvents(data);
					});
				}
				
				function handleGetDashboardEvents(data) {
					Model.getInstance().populateEventsWithXML(data);
/*
					var allEventsXML = $(data).find('event');
					o.allEvents = new Array();
					for (var i=0; i<allEventsXML.length; i++) {
						var evXML = allEventsXML[i];
						var ev = new Event();
						ev.populateWithXML(evXML);
						o.allEvents.push(ev);
					}
*/
					o.reloading = false;
					degree = 0;
					if (!!('ontouchstart' in window)) {
						$this.find('.content').touchScroll('setRestPosition', 0);
					}
					sortEvents();
					setUpUI();
					Model.getInstance().getModelDataAsJSON();
					checkinAndReportLocation(); // Global function
				}
				
				function sortEvents() {
					o.daysEvents = new Array();
					o.futureEvents = new Array();
					o.pastEvents = new Array();
					var allEvents = Model.getInstance().allEvents;
					var sortedEvents = allEvents.sort(compareDates);
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
					dashboard.find('.content').append('<div class="refreshHeader"><div class="refreshArrow"></div><div class="refreshContent">Pull down to refresh...</div></div>');
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
						var ev = Model.getInstance().getEventById(id);
						$(this).find(".voteButton").removeClass("iVotedFor");
						if (ev.getEventState() < Event.state.decided) {
							if (ev.didVoteForWinningLocation()) $(this).find(".voteButton").addClass("iVotedFor");
						} else {
							$(this).find(".voteButton").addClass("decidedVoteButton");
							$(this).find(".voteButton").css('backgroundImage', 'url('+ ev.getWinningLocationStaticMapUrl() +')');
							$(this).find(".voteButton").append('<div class="decidedIndicator">');
						}
					});
					setViewSize();
					setScroll();
				}
				
				function handleEventCellClick(eventId) {
					var ev = Model.getInstance().getEventById(eventId);
//					var showCountMeInButton = (!ev.didViewEvent() || !ev.didAcceptEvent() || ev.didDeclineEvent());
					ViewController.getInstance().showEventDetail(eventId, true, ev.showCountMeIn());
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
			$.error('Method ' +  method + ' does not exist on jQuery.dashboard');
		}
	};

})(jQuery);