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
				
				if (Model.getInstance().currentEvent) {
					o.event = Model.getInstance().currentEvent;
				} else {
					o.event = Model.getInstance().createNewEvent();
				}
//				o.lastUpdatedTimestamp = null;
				
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
					setUpUI();
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
					displayEvent();
					enableLocationButtons();
					enableVoteButtons();
					setViewSize();
					setScroll();
				}
				
				function displayEvent() {
					var content = $this.find('.content');
					content.html('');
					content.append('<ul class="collapseableList eventInfoForm">');
					var infoForm = 	'<li class="formInput"><h2>What</h2><input type="text" /></li>'+
									'<li class="formInput"><h2>When</h2><input class="dateTime" type="text" /></li>';
					content.find('.eventInfoForm').html(infoForm);
					content.append(o.event.locationList());
					content.append(o.event.participantList());
					var dateTimeField = content.find('.dateTime');
					var adjustedEventDate = o.event.eventDate; //new Date(o.event.eventDate - (o.event.eventDate.getTimezoneOffset() * 60 * 1000));
					var startYear = o.event.eventDate.getFullYear();
            		dateTimeField.scroller({ preset: 'datetime', theme: 'android', onSelect: checkTime, dateFormat: 'M d, yyyy', timeFormat: 'h:ii A', stepMinute: 5, startYear: startYear, endYear: startYear+1 });
					dateTimeField.scroller('setDate', adjustedEventDate);
					var fv = dateTimeField.scroller('getFormattedValue');
					dateTimeField.val(fv);
				}
				
				function checkTime() {
					var content = $this.find('.content');
					var dateTimeField = content.find('.dateTime');
					//alert(o.event.eventDate);
					//alert(dateTimeField.scroller('getDate'));
				}

				function enableLocationButtons() {
					$this.find(".locationList").find(".locationCell").each(function() {
						var id = $(this).attr("id");
						$(this).find(".locationInfo").unbind('click');
						$(this).find(".locationInfo").click(function() {
							ViewController.getInstance().showAddLocations(id);
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
	
	$.fn.createEvent = function(method) {
	    if (methods[method]) {
			return methods[method].apply(this, Array.prototype.slice.call(arguments, 1));
		} else if (typeof method === 'object' || !method) {
			return methods.init.apply(this, arguments);
		} else {
			$.error('Method ' +  method + ' does not exist on jQuery.createEvent');
		}
	};

})(jQuery);