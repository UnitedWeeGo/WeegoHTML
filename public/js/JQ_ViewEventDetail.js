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
		reloading: false
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
					$this.find('.content').css('height',document.documentElement.clientHeight - resizeOffset);
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
					$this.find('.refreshHeader').find('.refreshArrow').css({ WebkitTransform: 'rotate(' + degree + 'deg)'});
			        $this.find('.refreshHeader').find('.refreshArrow').css({ '-moz-transform': 'rotate(' + degree + 'deg)'});
			        if (up) {
			        	if (degree < 180) {
			        		degree += 5;
			        		setTimeout(function() { rotateArrow(true); },5);
			        	}
			        } else {
			        	if (degree > 0) {
			        		degree -= 5;
			        		setTimeout(function() { rotateArrow(); },5);
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
						setUpUI();
						ViewController.getInstance().showEventDetail(o.event.eventId, false, o.event.showCountMeIn(), true);
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

				function setUpUI() {
					var eventDetail = $this;
					eventDetail.find('.content').html('');
					eventDetail.find('.content').append('<div class="refreshHeader dark"><div class="refreshArrow"></div><div class="refreshContent">Pull down to refresh...</div></div>');
					eventDetail.find('.content').append(o.event.displayForEventDetail());
					if (o.event.getEventState() >= Event.state.decided) {
						o.otherLocationsShowing = true; //!o.otherLocationsShowing;
						toggleShowLocations();
						
						/*
						eventDetail.find('LI.hideLocations').click(function() {
							toggleShowLocations();
						});
						eventDetail.find('LI.showLocations').click(function() {
							toggleShowLocations();
						});
						*/
						
						if (o.event.allLocations.length > 0) {
							setupMap();
							
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
							o.mapBounds = new google.maps.LatLngBounds();
							for (var i = 0, LtLgLen = LatLngList.length; i < LtLgLen; i++) {
								o.mapBounds.extend(LatLngList[i]);
							}
							o.map.fitBounds(o.mapBounds);
						}
						
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
					setInitialLocation();
				}
				
				function setInitialLocation() {
					var browserSupportFlag = new Boolean();
					
					// Try W3C Geolocation (Preferred)
					if (navigator.geolocation) {
						browserSupportFlag = true;
						navigator.geolocation.getCurrentPosition(function(position) {
							o.myLocation = new google.maps.LatLng(position.coords.latitude,position.coords.longitude);
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
//							o.map.setCenter(o.myLocation);
						}, function() {
							handleNoGeolocation(browserSupportFlag);
						});
					// Try Google Gears Geolocation
					} else if (google.gears) {
						browserSupportFlag = true;
						var geo = google.gears.factory.create('beta.geolocation');
						geo.getCurrentPosition(function(position) {
							o.myLocation = new google.maps.LatLng(position.latitude,position.longitude);
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
//							o.map.setCenter(o.myLocation);
						}, function() {
							handleNoGeoLocation(browserSupportFlag);
						});
					// Browser doesn't support Geolocation
					} else {
						browserSupportFlag = false;
						handleNoGeolocation(browserSupportFlag);
					}
				}

				function handleNoGeolocation(errorFlag) {
					if (errorFlag == true) {
						alert("Geolocation service failed.");
					} else {
						alert("Your browser doesn't support geolocation.");
					}
				}
				
				function setBindings() {
					$(window).bind('countMeInClick', handleCountMeInClick);
					$(window).bind('moreButtonClick', handleMoreButtonClick);
				}
				
				function handleMoreButtonClick() {
					if ((!o.event.didAcceptEvent() && !o.event.didDeclineEvent()) || o.event.didDeclineEvent()) {
						$this.find('.actionSheet').append('<div class="button grey countMeIn">Count me in!</div>');
					}
					if ((!o.event.didAcceptEvent() && !o.event.didDeclineEvent()) || o.event.didAcceptEvent()) {
						$this.find('.actionSheet').append('<div class="button grey countMeOut">I\'m not coming</div>');
					}
//					$this.find('.actionSheet').append('<div class="button red removeEvent">Remove event</div>');
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