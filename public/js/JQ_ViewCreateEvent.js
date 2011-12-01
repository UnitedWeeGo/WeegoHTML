(function($) {
	
	var defaults = {
		eventId: '',
		event: null,
		lastUpdatedTimestamp: null,
		otherLocationsShowing: false, // Doesn't come into play until event decided
		reset: false,
		waitingForResponse: false
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
					enableAddFriendsButton();
					setViewSize();
					setScroll();
				}
				
				function displayEvent() {
					var content = $this.find('.content');
					content.html('');
					content.append('<ul class="collapseableList eventInfoForm">');
					var infoForm = 	'<li class="formInput"><h2>What</h2><input class="eventTitle" type="text" /></li>'+
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
					content.find('.eventTitle').change(function(){
						saveTitle();
					});
					content.find('.eventTitle').focusin(function(){
						if ($(this).hasClass('default')) {
							$(this).val('');
							$(this).removeClass('default');
						}
					});
					content.find('.eventTitle').focusout(function(){
						var titleNoWhitespace = o.event.eventTitle.replace(/ /g,'');
						if (titleNoWhitespace.length == 0) {
							var name = o.event.getCreatorNamePossessive();
							$(this).val(name +' event');
							$(this).addClass('default');
							saveTitle();
						}
					});
					var titleNoWhitespace = o.event.eventTitle.replace(/ /g,'');
					if (titleNoWhitespace.length > 0) {
						content.find('.eventTitle').val(o.event.eventTitle);
					} else {
						content.find('.eventTitle').addClass('default');
						var name = o.event.getCreatorNamePossessive();
						content.find('.eventTitle').val(name +' event');
						saveTitle();
					}
				}
				
				function saveTitle() {
					o.event.eventTitle = $this.find('.content').find('.eventTitle').val();
				}
				
				function checkTime() {
					var content = $this.find('.content');
					var dateTimeField = content.find('.dateTime');
					//alert(o.event.eventDate);
					o.event.eventDate = dateTimeField.scroller('getDate');
				}

				function enableLocationButtons() {
					$this.find(".locationList").find(".locationCell").each(function() {
						var id = $(this).attr("id");
						$(this).find(".locationInfo").unbind('click');
						$(this).find(".locationInfo").click(function() {
							var loc = o.event.getLocationById(id);
							if (id && loc.locationType == 'yelp') {
								ViewController.getInstance().showYelpReview(loc);
							} else {
								ViewController.getInstance().showAddLocations(id);
							}
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
							setUpUI();
						});
					});
				}
				
				function enableAddFriendsButton() {
					$this.find('.participantList').find('.callToAction').unbind('click');
					$this.find('.participantList').find('.callToAction').click(function() {
						ViewController.getInstance().showAddFriends();
					});
				}

				function toggleVoteForLocationWithId(locationId) {
					var index = -1;
					for (var i=0; i<o.event.currentLocationOrder.length; i++) {
						if (o.event.currentLocationOrder[i] == locationId) index = i;
					}
					o.event.currentLocationOrder.splice(index,1);
					if (o.event.iVotedFor(locationId)) {
						var index = -1;
						for (var i=0; i<o.event.locationsVotedFor.length; i++) {
							if (o.event.locationsVotedFor[i] == locationId) index = i;
						}
						o.event.locationsVotedFor.splice(index,1);
						o.event.currentLocationOrder.push(locationId);
					} else {
						o.event.locationsVotedFor.push(locationId);
						o.event.currentLocationOrder.unshift(locationId);
					}
				
/*					var xmlStr = '<event id="'+ o.event.eventId +'"><votes><vote locationId="'+ locationId +'" /></votes></event>';
					var url = domain + "/xml.vote.php";
					var params = {registeredId:ruid, xml:xmlStr};
					if (o.event.lastUpdatedTimestamp) params.timestamp = o.event.lastUpdatedTimestamp;
					$.post(url, params, function(data) {
						handleGetSingleEvent(data);
					});
*/
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
				
				function submitEvent() {
					if (o.waitingForResponse == false) {
						o.waitingForResponse = true;
						var url = domain + "/xml.post.php";
						var params = {registeredId:ruid, xml:o.event.xmlForUpload()};
						$.post(url, params, function(data) {
							handleSubmitEventResponse(data);
						});
					}
				}
				
				function handleSubmitEventResponse(data) {
					o.waitingForResponse = false;
					if ($(data).find('response').attr('code') == '250') {
						ViewController.getInstance().showDashboard();
					} else {
						// Error
					}
				}
				
				this.submitEvent = function() {
					return submitEvent();
				};
				
			});
		},
		
		done: function () {
			return this.each(function() {
				this.submitEvent();
			});
		}
		
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