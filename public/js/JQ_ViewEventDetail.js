(function($) {
	
	var defaults = {
		eventId: '',
		event: null,
		lastUpdatedTimestamp: null,
		otherLocationsShowing: false, // Doesn't come into play until event decided
		reset: false,
		map: null,
		myLocation: null,
		mapBounds: null
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
					Model.getInstance().currentEvent = o.event;
					setUpUI();
				}

				function setUpUI() {
					var eventDetail = $this;
					eventDetail.find('.content').html("");
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
						setupMap();
						
						var latlng = new google.maps.LatLng(o.event.getWinningLocation().latitude, o.event.getWinningLocation().longitude);
						var marker1 = new google.maps.Marker({
							position: latlng,
							map:o.map,
							animation: null
						});
						
						var LatLngList = new Array(latlng);
						o.mapBounds = new google.maps.LatLngBounds();
						for (var i = 0, LtLgLen = LatLngList.length; i < LtLgLen; i++) {
						  	o.mapBounds.extend (LatLngList[i]);
						}
						o.map.fitBounds (o.mapBounds);
						
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
				//      	callback.initialLocation = newyork;
					} else {
						alert("Your browser doesn't support geolocation. We've placed you in Siberia.");
				//      	callback.initialLocation = siberia;
					}
				//    callback.map.setCenter(initialLocation);
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