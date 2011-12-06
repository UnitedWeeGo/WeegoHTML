(function($) {
	
	var defaults = {
		eventId: '',
		event: null,
		lastUpdatedTimestamp: null,
		otherLocationsShowing: false, // Doesn't come into play until event decided
		reset: false,
		map: null,
		myLocation: null,
		mapBounds: null,
		reloading: false,
		participantLocs: null,
		distanceToLoc: null
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
				setBindings();
				
				function setViewSize() {
					$this.find('.content').css('height',document.documentElement.clientHeight - resizeOffset - 43); // 43 is height of bottom bar (messages button)
					$this.find('.refreshHeader').find('.refreshContent').css('width', document.documentElement.clientWidth - 74);
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
							getSingleEvent();
						}
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
						if (o.event.getEventState() >= Event.state.decided && o.event.getEventState() <= Event.state.ended) {
							getRecentLocations();
						} else {
							setUpUI();
							ViewController.getInstance().showEventDetail(o.event.eventId, false, o.event.showCountMeIn(), true);
						}
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
				
				function getRecentLocations() {
					var url = domain + "/get.report.location.php";
					var params = {registeredId:ruid, eventId:o.eventId};
					//if (o.event && o.event.lastUpdatedTimestamp) params.timestamp = o.event.lastUpdatedTimestamp;
					$.get(url, params, function(data) {
						handleGetRecentLocationsResponse(data);
					});
				}
				
				function handleGetRecentLocationsResponse(data) {
					o.participantLocs = new Array();
					if ($(data).find('response').attr('code') == '291') {
						$(data).find('reportLocation').each(function() {
							var rl = new ReportedLocation();
							var id = $(this).attr('email');
							if (id != Model.getInstance().loginParticipant.email) {
								rl.participant = o.event.getParticipantById($(this).attr('email'));
								rl.latitude = $(this).attr('latitude');
								rl.longitude = $(this).attr('longitude');
								o.participantLocs.push(rl);
							}
						});
					}
					setUpUI();
					ViewController.getInstance().showEventDetail(o.event.eventId, false, o.event.showCountMeIn(), true);
					checkinAndReportLocation(); // Global function
				}

				function setUpUI() {
					var eventDetail = $this;
					eventDetail.find('.content').html('');
					eventDetail.find('.content').append('<div class="refreshHeader dark"><div class="refreshArrow"></div><div class="refreshContent">Pull down to refresh...</div></div>');
					eventDetail.find('.content').append(o.event.displayForEventDetail());
					if (o.event.getEventState() >= Event.state.decided) {
						o.otherLocationsShowing = true; //!o.otherLocationsShowing;
						toggleShowLocations();
						
						if (o.event.allLocations.length > 0) {
							setupMap();
							o.mapBounds = new google.maps.LatLngBounds();
							placeWinner();
							placeParticipants();
							setInitialLocation();
						}
					}
					if (parseInt(o.event.unreadMessageCount) > 0) {
						eventDetail.find('.feedButton').addClass('new');
						eventDetail.find('.feedButton').find('.feedBubble').html(o.event.unreadMessageCount);
					} else {
						eventDetail.find('.feedButton').removeClass('new');
						eventDetail.find('.feedButton').find('.feedBubble').html('');
					}
					enableLocationButtons();
					enableMapButton();
					enableVoteButtons();
					enableAddFriendsButton();
					enableFeedButton();
					setViewSize();
					setScroll();
				}
				
				function enableFeedButton() {
					$this.find(".feedButton").unbind('click');
					$this.find(".feedButton").click(function() {
						ViewController.getInstance().showMessages(o.event.eventId);
					});
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
				
				function enableMapButton() {
					$this.find(".decidedMapCell").unbind('click');
					if (o.event.getEventState() >= Event.state.decided) {
						$this.find(".decidedMapCell").click(function() {
							ViewController.getInstance().showAddLocations(o.event.getWinningLocation().locationId);
						});
					}
				}

				function enableVoteButtons() {
					$this.find(".locationList").find(".locationCell").each(function() {
						var id = $(this).attr("id");
						$(this).find(".voteButton").removeClass("iVotedFor");
						if (id && o.event.iVotedFor(id)) $(this).find(".voteButton").addClass("iVotedFor");
						$(this).find(".voteButton").unbind('click');
						if (o.event.getEventState() < Event.state.decided) {
							$(this).find(".voteButton").click(function() {
								toggleVoteForLocationWithId(id);
							});
						} else {
							$(this).find(".voteButton").removeClass("iVotedFor");
							$(this).find(".voteButton").addClass("decidedVoteButton");
						}
					});
				}
				
				function enableAddFriendsButton() {
					$this.find('.participantList').find('.callToAction').unbind('click');
					$this.find('.participantList').find('.callToAction').click(function() {
						ViewController.getInstance().showAddFriends();
					});
				}

				function toggleVoteForLocationWithId(locationId) {
					var xmlStr = '<event id="'+ o.event.eventId +'"><votes><vote locationId="'+ locationId +'" /></votes></event>';
					var url = domain + "/xml.vote.php";
					var params = {registeredId:ruid, xml:xmlStr};
					if (o.event.lastUpdatedTimestamp) params.timestamp = o.event.lastUpdatedTimestamp;
					$.post(url, params, function(data) {
						handleGetSingleEvent(data);
						setUpUI();
					});
				}

				function toggleShowLocations() {
					o.otherLocationsShowing = !o.otherLocationsShowing;
					$this.find('LI.showLocations').css('display', 'none');
					$this.find('LI.hideLocations').css('display', 'none');
					if (o.otherLocationsShowing) {
						$this.find('UL.locationList').removeClass('hideLocations');
						$this.find('LI.hideLocations').css('display', 'list-item');
					} else {
						$this.find('UL.locationList').addClass('hideLocations');
						$this.find('LI.showLocations').css('display', 'list-item');
					}
					setScroll();
				}
				
				function setupMap() {
					var myOptions = {
						zoom: 12,
						disableDefaultUI: true,
						draggable: false,
						disableDoubleClickZoom: true,
						scrollwheel: false,
						mapTypeId: google.maps.MapTypeId.ROADMAP
					};
					o.map = new google.maps.Map(document.getElementById('map_canvas_details'), myOptions);
				}
				
				function placeWinner() {
					var latlng = new google.maps.LatLng(o.event.getWinningLocation().latitude, o.event.getWinningLocation().longitude);
					var marker1 = new google.maps.Marker({
						position: latlng,
						map:o.map,
						icon: new google.maps.MarkerImage('/assets/images/POIs_decided_default_sm.png',
														new google.maps.Size(29, 33),
														new google.maps.Point(0,0), //origin
														new google.maps.Point(15, 33)), //anchor
						animation: null
					});
					
					var LatLngList = new Array(latlng);
					for (var i = 0, LtLgLen = LatLngList.length; i < LtLgLen; i++) {
						o.mapBounds.extend(LatLngList[i]);
					}
					o.map.fitBounds(o.mapBounds);
				}
				
				function placeParticipants() {
					if (o.participantLocs.length > 0) {
						for (var i=0; i<o.participantLocs.length; i++) {
							var rl = o.participantLocs[i];
							var latlng = new google.maps.LatLng(rl.latitude, rl.longitude);
							var marker1 = new google.maps.Marker({
								position: latlng,
								map:o.map,
								icon: new google.maps.MarkerImage(rl.participant.avatarURL,
																new google.maps.Size(33, 33),
																new google.maps.Point(0,0), //origin
																new google.maps.Point(16, 16),
																new google.maps.Size(33,33)), //anchor
								animation: null
							});
							o.mapBounds.extend(latlng);
						}
						o.map.fitBounds(o.mapBounds);
					}
				}
				
				function setInitialLocation() {
					Model.getInstance().updateGeoLocation();			
				}
				
				function handleGeoLocationUpdated() {
					o.myLocation = Model.getInstance().getGeoLocation();
					if (o.event && o.myLocation && o.event.getWinningLocation()) {
						var latlng = new google.maps.LatLng(o.event.getWinningLocation().latitude, o.event.getWinningLocation().longitude);
						o.distanceToLoc = google.maps.geometry.spherical.computeDistanceBetween(o.myLocation, latlng);
						var marker0 = new google.maps.Marker({
							position: o.myLocation,
							map:o.map,
							icon: new google.maps.MarkerImage('/assets/images/POIs_me_default.png',
														new google.maps.Size(20, 20),
														new google.maps.Point(0,0), //origin
														new google.maps.Point(12, 10)), //anchor
							animation: null
						});
						o.mapBounds.extend(o.myLocation);
						o.map.fitBounds(o.mapBounds);
					}
				}
				
				function handleGeoLocationException() {
					
				}
				
				function setBindings() {
					$(window).bind('countMeInClick', handleCountMeInClick);
					$(window).bind('moreButtonClick', handleMoreButtonClick);
					
					$(window).bind('geoLocationUpdated', handleGeoLocationUpdated);
					$(window).bind('geoLocationException', handleGeoLocationException);
				}
				
				function handleMoreButtonClick() {
					if ((!o.event.didAcceptEvent() && !o.event.didDeclineEvent()) || o.event.didDeclineEvent()) {
						$this.find('.actionSheet').append('<div class="button grey countMeIn">Count me in!</div>');
					}
					if ((!o.event.didAcceptEvent() && !o.event.didDeclineEvent()) || o.event.didAcceptEvent()) {
						$this.find('.actionSheet').append('<div class="button grey countMeOut">I\'m not coming</div>');
					}
//					$this.find('.actionSheet').append('<div class="button red removeEvent">Remove event</div>');
					if (o.event.eligibleForCheckin()) {
						$this.find('.actionSheet').append('<div class="button black checkIn">Check me in</div>');
					}
					
					if (o.event.eligibleForLocationReporting()) {
						$this.find('.actionSheet').append('<div class="button black reportLocation">Share my location</div>');
					}
					
					$this.find('.actionSheet').append('<div class="button black cancelActionSheet">Cancel</div>');
					$this.find('.actionSheetBlocker').css('display','block');
					$this.find('.actionSheet').css('display','block');
					$this.find('.actionSheet').find('.countMeIn').bind('click', function(){
						handleCountMeInClick();
						closeActionSheet();
					});
					$this.find('.actionSheet').find('.countMeOut').bind('click', function(){
						handleCountMeOutClick();
						closeActionSheet();
					});
					$this.find('.actionSheet').find('.removeEvent').bind('click', function(){
						closeActionSheet();
					});
					$this.find('.actionSheet').find('.cancelActionSheet').bind('click', function(){
						closeActionSheet();
					});
					
					$this.find('.actionSheet').find('.checkIn').bind('click', function(){
						checkIn(o.event.eventId);
					});
					$this.find('.actionSheet').find('.reportLocation').bind('click', function(){
						setInitialLocation();
						reportLocation(o.myLocation.lat(), o.myLocation.lng());
					});
				}
				
				function closeActionSheet() {
					$this.find('.actionSheetBlocker').css('display','none');
					$this.find('.actionSheet').css('display','none');
					$this.find('.actionSheet').html('');
				}
				
				function handleCountMeInClick() {
					var url = domain + "/mod.acceptevent.php";
					var params = {registeredId:ruid, eventId:o.event.eventId, didAccept:"true"};
					$.post(url, params, function(data) {
						handleEventAcceptanceResponse(data);
					});
				}
				
				function handleCountMeOutClick() {
					var url = domain + "/mod.acceptevent.php";
					var params = {registeredId:ruid, eventId:o.event.eventId, didAccept:"false"};
					$.post(url, params, function(data) {
						handleEventAcceptanceResponse(data);
					});
				}
				
				function handleEventAcceptanceResponse(data) {
					handleGetSingleEvent(data);
					ViewController.getInstance().showEventDetail(o.event.eventId, false, o.event.showCountMeIn(), true);
					$this.find('.participantList').html(o.event.participantListItems());
					Model.getInstance().getModelDataAsJSON();
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
			$.error('Method ' +  method + ' does not exist on jQuery.eventDetail');
		}
	};

})(jQuery);