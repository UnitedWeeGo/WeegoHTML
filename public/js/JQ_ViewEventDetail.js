(function($) {
	
	var defaults = {
		eventId: '',
		event: null,
		lastUpdatedTimestamp: null,
		otherLocationsShowing: false, // Doesn't come into play until event decided
		reset: false
	};
	
	var methods = {
		
		init: function(options) {
			return this.each(function() {
				
				var o = $.extend(defaults, options);
				
				o.event = null;
				o.lastUpdatedTimestamp = null;
				
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
					if (o.reset) {
						o.reset = false;
						o.otherLocationsShowing = false;
						resetScroll();
					}
					$this.find('.content').html("");
					getSingleEvent();
				};
				
				update();
				
				function setViewSize() {
					$this.find('.content').css('height',document.documentElement.clientHeight - resizeOffset);
				}
				
				function setScroll() {
					if (!!('ontouchstart' in window)) {
						$this.find('.content').touchScroll();
					}
				}
				
				function resetScroll() {
					if (!!('ontouchstart' in window)) {
						$this.find('.content').touchScroll('setPosition', 0);
					}
				}
				
				function getSingleEvent() {
					var url = domain + "/get.event.php";
					var params = {registeredId:ruid, eventId:o.eventId};
					if (o.event && o.event.lastUpdatedTimestamp) params.timestamp = o.event.lastUpdatedTimestamp;
					$.get(url, params, function(data) {
						handleGetSingleEvent(data);
					});
				}

				function handleGetSingleEvent(data) {
					o.lastUpdatedTimestamp = $(data).find('response').attr('timestamp');
					var allEventsXML = $(data).find('event');
					for (var i=0; i<allEventsXML.length; i++) {
						var evXML = allEventsXML[i];
						if (!o.event) o.event = new Event();
						o.event.lastUpdatedTimestamp = $(data).find('response').attr('timestamp');
						o.event.populateWithXML(evXML);
					}
					setUpUI();
				}

				function setUpUI() {
					var eventDetail = $this;
					eventDetail.find('.content').html("");
					eventDetail.find('.content').append(o.event.displayForEventDetail());
					if (o.event.getEventState() >= Event.state.decided) {
						o.otherLocationsShowing = !o.otherLocationsShowing;
						toggleShowLocations();
						eventDetail.find('LI.hideLocations').click(function() {
							toggleShowLocations();
						});
						eventDetail.find('LI.showLocations').click(function() {
							toggleShowLocations();
						});
					}
					enableLocationButtons();
					enableVoteButtons();
					setViewSize();
					setScroll();
				}

				function enableLocationButtons() {
					$this.find(".locationList").find(".locationCell").each(function() {
						var id = $(this).attr("id");
						$(this).find(".locationInfo").unbind('click');
						$(this).find(".locationInfo").click(function() {
							ViewController.getInstance().showAddLocations(o.event, id);
						});
					});
				}

				function enableVoteButtons() {
					$this.find(".locationList").find(".locationCell").each(function() {
						var id = $(this).attr("id");
						$(this).find(".voteButton").removeClass("iVotedFor");
						if (id && o.event.iVotedFor(id)) $(this).find(".voteButton").addClass("iVotedFor");
						$(this).find(".voteButton").unbind('click');
						$(this).find(".voteButton").click(function() {
							toggleVoteForLocationWithId(id);
						});
					});
				}

				function toggleVoteForLocationWithId(locationId) {
					var xmlStr = '<event id="'+ o.event.eventId +'"><votes><vote locationId="'+ locationId +'" /></votes></event>';
					var url = domain + "/xml.vote.php";
					var params = {registeredId:ruid, xml:xmlStr};
					if (o.event.lastUpdatedTimestamp) params.timestamp = o.event.lastUpdatedTimestamp;
					$.post(url, params, function(data) {
						handleGetSingleEvent(data);
					});
				}

				function toggleShowLocations() {
					o.otherLocationsShowing = !o.otherLocationsShowing;
					$("#eventDetail").find('LI.showLocations').css('display', 'none');
					$("#eventDetail").find('LI.hideLocations').css('display', 'none');
					if (o.otherLocationsShowing) {
						$("#eventDetail").find('UL.locationList').removeClass('hideLocations');
						$("#eventDetail").find('LI.hideLocations').css('display', 'list-item');
					} else {
						$("#eventDetail").find('UL.locationList').addClass('hideLocations');
						$("#eventDetail").find('LI.showLocations').css('display', 'list-item');
					}
					setScroll();
				}
				
			});
		},		
	};
	
	$.fn.eventDetail = function(method) {
	    if (methods[method]) {
			return methods[method].apply(this, Array.prototype.slice.call(arguments, 1));
		} else if (typeof method === 'object' || !method) {
			return methods.init.apply(this, arguments);
		} else {
			$.error('Method ' +  method + ' does not exist on jQuery.touchScroll');
		}
	};

})(jQuery);