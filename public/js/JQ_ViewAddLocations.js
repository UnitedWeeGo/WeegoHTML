(function($) {
	
	var defaults = {
			event: null,
			startingLocation: null,
			map: null,
			client: new simplegeo.PlacesClient('dkjJdBSEvxRn4w4LzQj5mZQCVtw4FsYh'),
			
			selectedLocation: null,
			markers: new Array(),
			
			originalLocations: new Array(),
			searchResults: new Array(),
			newLocations: new Array(),
			
			initialDisplayFinished: false,
			newSearchResultsDisplay: false,
			
			markerStateResults: {def:100, selected:101, hasDeal:102},
			markerStateAdded: {def:200, selected:201, disabled:202},
			markerStateLiked: {def:300, selected:301, disabled:302},
			markerStateDecided: {def:400, selected:401},
			markerStateMyLocation: {def:500},
			
			initialLocation: null,
			locationId: null,
			
			mapBounds: null
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
	
					var myLatlng = null;
					var zoomLevel = 4;
					
					if (o.locationId) {
						o.startingLocation = o.event.getLocationById(o.locationId);
						o.selectedLocation = o.startingLocation;
						myLatlng = new google.maps.LatLng(o.startingLocation.latitude, o.startingLocation.longitude);
						zoomLevel = 12;
					} else {
						myLatlng = new google.maps.LatLng(37.77493,-122.419416);
						zoomLevel = 8;
					}
					var myOptions = {
						zoom: zoomLevel,
						center: myLatlng,
						disableDefaultUI: true,
						mapTypeId: google.maps.MapTypeId.ROADMAP
					};
					
					//if (o.map) o.map = null;
					o.map = new google.maps.Map(document.getElementById('map_canvas'), myOptions);
					
//					o.client = new simplegeo.PlacesClient('dkjJdBSEvxRn4w4LzQj5mZQCVtw4FsYh');
					
					$this.find('#locationDetail').find('.locationInfo').html('');
					
					if (o.locationId) {
						showLocationDetail(o.startingLocation);
					} 
										
					o.originalLocations = o.event.allLocations.slice();
					
					o.mapBounds = new google.maps.LatLngBounds();
					
					if (o.event.getEventState() < Event.state.decided) {
						placeMarkers();
						setMapBounds(o.originalLocations);
						setInitialLocation();
					} else {
						placeMarkersDecided();
						setMapBounds(new Array(o.event.getWinningLocation()));
						setInitialLocation(true);
					}
					
					o.initialDisplayFinished = true;
					
					setEvents();
				};
				
				update();
				
				function setViewSize() {
					$this.find('.content').css('height',document.documentElement.clientHeight - resizeOffset);
				}
				
				function setMapBounds(arr, clear) {
					if (clear) o.mapBounds = new google.maps.LatLngBounds();
					for (var i=0; i<arr.length; i++) {
						var latlng = new google.maps.LatLng(arr[i].latitude, arr[i].longitude);
						o.mapBounds.extend(latlng);
					}
					o.map.fitBounds(o.mapBounds);
				}
				
				function placeMarkers() {
					removeMarkers();
					var zIndex = 0;
					for (var i=0; i<o.originalLocations.length; i++) {
						var loc = o.originalLocations[i];
						if (o.markers[loc.g_id]) continue;
						o.markers[loc.g_id] = getMarker(loc, zIndex, !o.initialDisplayFinished, o.searchResults.length > 0);
						zIndex++;
					}
					for (var i=0; i<o.newLocations.length; i++) {
						var loc = o.newLocations[i];
						if (o.markers[loc.g_id]) {
							if (!loc.locationId) o.markers[loc.g_id].setMap(null);
							else continue;
						}
						o.markers[loc.g_id] = getMarker(loc, zIndex, false, false);
						zIndex++;
					}
					for (var i=0; i<o.searchResults.length; i++) {
						var loc = o.searchResults[i];
						if (o.markers[loc.g_id]) continue;
						o.markers[loc.g_id] = getMarker(loc, zIndex, o.newSearchResultsDisplay, false);
						zIndex++;
					}
					
				}
				
				function placeMarkersDecided() {
					removeMarkers();
					var zIndex = 0;
					var loc = o.event.getWinningLocation();
					o.markers[loc.g_id] = getMarker(loc, zIndex, !o.initialDisplayFinished, false);
				}

				function getMarker(loc, zIndex, animated, disabled) {
					var selected = false;
					var notAnimated = false;
					if (loc == o.selectedLocation) selected = true;
					var state = o.markerStateResults.def;
					if (loc.hasDeal) state = o.markerStateResults.hasDeal;
					if (selected) state = o.markerStateResults.selected;
					if (loc.locationId) {
						if (o.event.getEventState() >= Event.state.decided) {
							state = o.markerStateDecided.def;
							if (selected) state = o.markerStateDecided.selected;
						} else if (o.event.iVotedFor(loc.locationId)) {
							state = o.markerStateLiked.def;
							if (selected) state = o.markerStateLiked.selected;
							if (disabled) state = o.markerStateLiked.disabled;
						} else {
							state = o.markerStateAdded.def;
							if (selected) state = o.markerStateAdded.selected;
							if (disabled) state = o.markerStateAdded.disabled;
						}
					}
					var latlng = new google.maps.LatLng(loc.latitude, loc.longitude);
					var marker = new google.maps.Marker({
						position: latlng,
						map:o.map,
						icon:getMarkerImage(state),
						title:loc.name,
						locObject:loc,
						animation: (animated) ? google.maps.Animation.DROP : null
					});
					if (!disabled) {
						google.maps.event.addListener(marker, 'click', function() {
							showLocationDetail(this.locObject);
							o.selectedLocation = this.locObject;
							if (o.event.getEventState() < Event.state.decided) {
								placeMarkers();
							} else {
								placeMarkersDecided();
							}
						});
					}
					return marker;
				}

				function removeMarkers() {
					for (var i in o.markers) { //  (var i=0; i<this.markers.length; i++) {
						var marker = o.markers[i];
						// remove 'click' listener ??
						marker.setMap(null);
					}
					o.markers = new Array();
				}

				function getMarkerImage(state) {
					var url = '/assets/images/';
					switch (state) {
						case 	o.markerStateAdded.def :
								url += 'POIs_place_default_sm.png';
								break;
						case 	o.markerStateAdded.selected :
								url += 'POIs_place_selected_sm.png';
								break;
						case 	o.markerStateAdded.disabled :
								url += 'POIs_place_disabled_sm.png';
								break;
						case 	o.markerStateLiked.def :
								url += 'POIs_liked_default_sm.png';
								break;
						case 	o.markerStateLiked.selected :
								url += 'POIs_liked_selected_sm.png';
								break;
						case 	o.markerStateLiked.disabled :
								url += 'POIs_liked_disabled_sm.png';
								break;
						case 	o.markerStateResults.def :
								url += 'POIs_search_default.png';
								break;
						case 	o.markerStateResults.selected :
								url += 'POIs_search_selected.png';
								break;
						case 	o.markerStateResults.hasDeal :
								url += 'POIs_deal_default.png';
								break;
						case	o.markerStateDecided.def :
								url += 'POIs_decided_default_sm.png';
								break;
						case	o.markerStateDecided.selected :
								url += 'POIs_decided_selected_sm.png';
								break;
						case	o.markerStateMyLocation.def :
								url += 'POIs_me_default.png';
								break;
						default :
								return null;
					}
					var image = new google.maps.MarkerImage(url,
															new google.maps.Size(29, 33),
															new google.maps.Point(0,0), //origin
															new google.maps.Point(15, 33)); //anchor
					if (state < 200) image = new google.maps.MarkerImage(url,
															new google.maps.Size(30, 39),
															new google.maps.Point(0,0), //origin
															new google.maps.Point(9, 37)); //anchor
					if (state == o.markerStateMyLocation.def) image = new google.maps.MarkerImage(url,
															new google.maps.Size(20, 20),
															new google.maps.Point(0,0), //origin
															new google.maps.Point(12, 10)); //anchor
					return image;									
				}

				function setEvents() {
					$this.find('#locationSearch').find('#submit').unbind('click');
					$this.find('#locationSearch').find('#submit').click(function() {
						searchSimpleGeo();
					});
				}

				function showLocationDetail(loc) {
					$this.find('#locationDetail').html("");
				//	$this.find('#locationDetail').find(".voteButton").removeClass("iVotedFor");
				//	$this.find('#locationDetail').find(".voteButton").removeClass("notVotedFor");
				//	$this.find('#locationDetail').find(".voteButton").unbind('click');
					var iVotedFor = o.event.iVotedFor(loc.locationId);
					$this.find('#locationDetail').append(loc.displayForLocationDetail());
					if (!loc.locationId) {
						$this.find('#locationDetail').find(".voteButton").click(function() {
							addLocation(loc);
						});
					} else { 
						if (iVotedFor) $this.find('#locationDetail').find(".voteButton").addClass("iVotedFor");
						else $this.find('#locationDetail').find(".voteButton").addClass("notVotedFor");
						if (o.event.getEventState() < Event.state.decided) {
							$this.find('#locationDetail').find(".voteButton").click(function() {
								toggleVoteForLocation(loc);
							});
						} else {
							$this.find('#locationDetail').find(".voteButton").removeClass("iVotedFor");
							$this.find('#locationDetail').find(".voteButton").removeClass("notVotedFor");
							$this.find('#locationDetail').find(".voteButton").addClass("decidedVoteButton");
						}
					}
				}

				function clearSearchResults() {
					
				}

				function searchSimpleGeo() {
					o.originalLocations = o.event.allLocations.slice();
					o.newLocations = new Array();
					var searchText = $this.find('#locationSearchField').val();
					var latlng = o.map.getCenter();
					var lat = latlng.lat();
					var lng = latlng.lng();
					o.client.search(lat, lng, {q:searchText}, function(err, data) {
						if (err) {
							alert(err);
						} else {
							o.searchResults = new Array();
							for (var i in data.features) {
								var feature = data.features[i];
								var loc = new Location();
								loc.populateWithSGFeature(feature);
								if (!o.markers[loc.g_id]) o.searchResults.push(loc);
							}
							o.newSearchResultsDisplay = true;
							placeMarkers();
							o.newSearchResultsDisplay = false;
						}
					});
				}

				function addLocation(loc) {
					o.selectedLocation = loc;
					loc.tempId = guidGenerator();
					if (Model.getInstance().currentAppState == Model.appState.eventDetail) {
						var xmlStr =	'<event id="'+ o.event.eventId +'">';
							xmlStr +=		'<locations>';
							xmlStr +=			loc.xmlForUpload(loc.tempId);
							xmlStr +=		'</locations>';
							xmlStr +=	'</event>';
						var url = domain + "/xml.location.php";
						var params = {registeredId:ruid, xml:xmlStr};
						if (o.event.lastUpdatedTimestamp) params.timestamp = o.event.lastUpdatedTimestamp;
						$.post(url, params, function(data) {
							handleGetSingleEvent(data);
						});
					} else {
						
					}
				}

				function toggleVoteForLocation(loc) {
					o.selectedLocation = loc;
					var xmlStr = '<event id="'+ o.event.eventId +'"><votes><vote locationId="'+ loc.locationId +'" /></votes></event>';
					var url = domain + "/xml.vote.php";
					var params = {registeredId:ruid, xml:xmlStr};
					if (o.lastUpdatedTimestamp) params.timestamp = o.lastUpdatedTimestamp;
					$.post(url, params, function(data) {
						handleGetSingleEvent(data);
					});
				}

				function guidGenerator() {
					var S4 = function() {
					   return (((1+Math.random())*0x10000)|0).toString(16).substring(1);
					};
					return (S4()+S4()+"-"+S4()+"-"+S4()+"-"+S4()+"-"+S4()+S4()+S4());
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
					o.newLocations = new Array();
					for (var i=0; i<o.event.allLocations.length; i++) {
						var loc1 = o.event.allLocations[i];
						var found = false;
						for (var j=0; j<o.originalLocations.length; j++) {
							var loc2 = o.originalLocations[j];
							if (loc1.g_id == loc2.g_id) {
								found = true;
							}
						}
						if (!found) o.newLocations.push(loc1);
					}
					if (!o.selectedLocation.locationId) o.selectedLocation = o.event.getOfficialLocationByTempId(o.selectedLocation.tempId);
					showLocationDetail(o.selectedLocation);
					placeMarkers();
				}

				function setInitialLocation(resetBounds) {
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
							if (resetBounds) {
								o.mapBounds.extend(o.myLocation);
								o.map.fitBounds(o.mapBounds);
							}
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
							if (resetBounds) {
								o.mapBounds.extend(o.myLocation);
								o.map.fitBounds(o.mapBounds);
							}
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
	
	$.fn.addLocations = function(method) {
	    if (methods[method]) {
			return methods[method].apply(this, Array.prototype.slice.call(arguments, 1));
		} else if (typeof method === 'object' || !method) {
			return methods.init.apply(this, arguments);
		} else {
			$.error('Method ' +  method + ' does not exist on jQuery.touchScroll');
		}
	};

})(jQuery);