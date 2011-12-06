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
			
			mapBounds: null,
			
			locCategories: null
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
					
					if (o.event.getEventState() < Event.state.decided) {
						$this.find('#locationSearch').css('display','block');
					} else {
						$this.find('#locationSearch').css('display','none');
					}
					
					setViewSize();
	
					o.initialDisplayFinished = false;
					
					clearSearchResults();
	
					var myLatlng = null;
					var zoomLevel = 4;
					
					o.startingLocation = o.event.getLocationById(o.locationId);
					if (o.locationId && o.startingLocation) {
						//o.startingLocation = o.event.getLocationById(o.locationId);
						o.selectedLocation = o.startingLocation;
						myLatlng = new google.maps.LatLng(o.startingLocation.latitude, o.startingLocation.longitude);
						zoomLevel = 12;
					} else {
						myLatlng = new google.maps.LatLng(37.77493,-122.419416);
						zoomLevel = 2;
					}
					var zoomControl = (window.Android) ? true : false;
					var myOptions = {
						zoom: zoomLevel,
						center: myLatlng,
						disableDefaultUI: true,
						zoomControl: zoomControl,
						zoomControlOptions: {position:google.maps.ControlPosition.LEFT_CENTER},
						mapTypeId: google.maps.MapTypeId.ROADMAP
					};
					
					//if (o.map) o.map = null;
					o.map = new google.maps.Map(document.getElementById('map_canvas'), myOptions);
					
//					o.client = new simplegeo.PlacesClient('dkjJdBSEvxRn4w4LzQj5mZQCVtw4FsYh');
					
					$this.find('#locationDetail').find('.locationInfo').html('');
					
					if (o.locationId && o.startingLocation) {
						showLocationDetail(o.startingLocation);
					} else {
						$this.find('#locationDetail').html("");
						$this.find('#locationDetail').css('display', 'none');
					}
										
					o.originalLocations = o.event.allLocations.slice();
					
					o.mapBounds = new google.maps.LatLngBounds();
					
					if (o.event.getEventState() < Event.state.decided) {
						placeMarkers();
						if (o.originalLocations.length > 0) setMapBounds(o.originalLocations);
						setInitialLocation(true);
					} else {
						placeMarkersDecided();
						setInitialLocation(true);
						setMapBounds(new Array(o.event.getWinningLocation()));
						if (o.event.getEventState() <= Event.state.ended) {
							getRecentLocations();
						}
					}
					
					o.initialDisplayFinished = true;
					
					setEvents();
					
					getCategories();
				};
				
				update();
				setBindings();
				
				function getCategories() {
					o.locCategories = new Array();
//					getCategoriesSimpleGeo();
					getCategoriesYelp();
				}
				
				function getCategoriesSimpleGeo() {
					o.client.getFeatureCategories(function(err, data){
						if (err) {
							console.log(err);
						} else {
							for (var i=39; i<data.length; i++) {
								var sc = new SearchCategory();
								sc.populateWithSG(data[i]);
								o.locCategories.push(sc);
								//console.log(sc.subcategory);
							}
						}
					});
				}
				
				function getCategoriesYelp() {
					var url = domain + "/categories.php";
					var params = {registeredId:ruid};
					$.get(url, params, function(data) {
						for (var i=0; i<data.length; i++) {
							var sc = new SearchCategory();
							sc.category = data[i];
							o.locCategories.push(sc);
						}
					});
				}
				
				function setViewSize() {
					$this.find('.content').css('height',document.documentElement.clientHeight - resizeOffset);
					$this.find('#locationSearchField').css('width',document.documentElement.clientWidth - $this.find('#locationSearch').find('.buttons').outerWidth() - 32);
					$this.find('#locationDetail').css('width',document.documentElement.clientWidth - 16);
					var hAdjustment = (o.event.getEventState() < Event.state.decided) ? 36 : 0;
					$this.find('#map_canvas').css('height', document.documentElement.clientHeight - (resizeOffset + hAdjustment));
					$this.find('#categoryListContainer').css('height', document.documentElement.clientHeight - (resizeOffset + 36));
				}
				
				function setMapBounds(arr, clear) {
					if (clear) o.mapBounds = new google.maps.LatLngBounds();
					for (var i=0; i<arr.length; i++) {
						var latlng = new google.maps.LatLng(arr[i].latitude, arr[i].longitude);
						o.mapBounds.extend(latlng);
					}
					o.map.fitBounds(o.mapBounds);
				}
				
				function getRecentLocations() {
					var url = domain + "/get.report.location.php";
					var params = {registeredId:ruid, eventId:o.event.eventId};
					//if (o.event && o.event.lastUpdatedTimestamp) params.timestamp = o.event.lastUpdatedTimestamp;
					$.get(url, params, function(data) {
						handleGetRecentLocationsResponse(data);
					});
				}
				
				function handleGetRecentLocationsResponse(data) {
					var participantLocs = new Array();
					if ($(data).find('response').attr('code') == '291') {
						$(data).find('reportLocation').each(function() {
							var rl = new ReportedLocation();
							var id = $(this).attr('email');
							if (id != Model.getInstance().loginParticipant.email) {
								rl.participant = o.event.getParticipantById($(this).attr('email'));
								rl.latitude = $(this).attr('latitude');
								rl.longitude = $(this).attr('longitude');
								participantLocs.push(rl);
							}
						});
					}
					if (participantLocs.length > 0) {
						for (var i=0; i<participantLocs.length; i++) {
							var rl = participantLocs[i];
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
						beginSearch();
					});
					
					$this.find('#locationSearchField').unbind('keyup');
					$this.find('#locationSearchField').keyup(function(e) {
						console.log("keyup");
						if (e.which == 13) {
							jQuery(this).blur();
							beginSearch();
						} else {
							filterCategories();
						}
					});
					
					$this.find('#locationSearch').find('#cancel').unbind('click');
					$this.find('#locationSearch').find('#cancel').click(function() {
						clearSearchResults();
						placeMarkers();
					});
					
					$this.find('#locationSearchField').unbind('focusin');
					$this.find('#locationSearchField').focusin(function(){
						if ($(this).hasClass('default')) {
							$(this).val('');
							$(this).removeClass('default');
						}
					});
				}
				
				function filterCategories() {
					var results = new Array();
					var re = $this.find('#locationSearchField').val().toLowerCase();
					if (re.length > 1) {
						for (var i=0; i<o.locCategories.length; i++) {
							var sc = o.locCategories[i];
							if (sc.getKeyValue().toLowerCase().indexOf(re) > -1) {
								results.push(sc);
							}
						}
					}
					/*
					for (var i=0; i<results.length; i++) {
						var sc = results[i];
						console.log(sc.getKeyValue() +" : "+ sc.category_id);
					}
					*/
					if (results.length > 0) {
						$this.find('#categoryListContainer').find('.listContent').html('');
						$this.find('#categoryListContainer').find('.listContent').append('<ul class="categoryList">');
						for (var i=0; i<results.length; i++) {
							var sc = results[i];
							$this.find('#categoryListContainer').find('.categoryList').append('<li class="categoryItem">'+ sc.getKeyValue() +'</li>');
						}
						$this.find('#categoryListContainer').css('display', 'block');
						$this.find('#categoryListContainer').find('.categoryList').find('.categoryItem').click(function() {
							$this.find('#locationSearchField').val($(this).text());
							beginSearch();
						});
						resetScroll();
					} else {
						$this.find('#categoryListContainer').find('.listContent').html('');
						$this.find('#categoryListContainer').css('display', 'none');
					}
				}
				
				function resetScroll() {
					if (!!('ontouchstart' in window)) {
						$this.find('#categoryListContainer').find('.listContent').touchScroll('setPosition', 0);
					}
				}

				function showLocationDetail(loc) {
					if (loc) {
						hideNameEdit();
						$this.find('#locationDetail').css('display', 'block');
						$this.find('#locationDetail').html("");
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
						$this.find('#locationDetail').find(".locationInfo").unbind('click');
						if (loc.locationType == 'yelp') {
							$this.find('#locationDetail').find(".locationInfo").click(function() {
								ViewController.getInstance().showYelpReview(loc,true);
							});
						}
						$(window).unbind('cancelEditButtonClick');
						$(window).unbind('doneEditButtonClick');
						$this.find('#locationEdit').find('INPUT').unbind('keyup');
						$this.find('#locationDetail').find('.editButton').unbind('click');
						$this.find('#locationDetail').find('.editButton').click(function(){
							showNameEdit();
						});
					}
				}
				
				function showNameEdit() {
					$this.find('#locationDetail').css('display','none');
					$this.find('#locationSearch').css('display','none');
					$this.find('#locationEdit').css('display','block');
					$this.find('#locationEdit').find('INPUT').val('');
					$this.find('#locationEdit').find('INPUT').focus();
					var hAdjustment = 0;
					$this.find('#map_canvas').css('height', document.documentElement.clientHeight - (resizeOffset + hAdjustment));
					ViewController.getInstance().showEditLocationNav();
					$(window).bind('cancelEditButtonClick', hideNameEdit);
					$(window).bind('doneEditButtonClick', doneNameEdit);
					$this.find('#locationEdit').find('INPUT').unbind('keyup');
					$this.find('#locationEdit').find('INPUT').keyup(function(e) {
						console.log("keyup");
						if (e.which == 13) {
							jQuery(this).blur();
							doneNameEdit();
						}
					});
				}
				
				function hideNameEdit() {
					$(window).unbind('cancelEditButtonClick');
					$(window).unbind('doneEditButtonClick');
					$this.find('#locationEdit').find('INPUT').unbind('keyup');
					$this.find('#locationDetail').css('display','block');
					$this.find('#locationSearch').css('display','block');
					$this.find('#locationEdit').css('display','none');
					var hAdjustment = 36;
					$this.find('#map_canvas').css('height', document.documentElement.clientHeight - (resizeOffset + hAdjustment));
					ViewController.getInstance().showAddLocationNav();
				}
				
				function doneNameEdit() {
					$(window).unbind('doneEditButtonClick');
					var editText = $this.find('#locationEdit').find('INPUT').val();
					var editTextNoWhite = editText.replace(/ /g,'');
					if (editTextNoWhite.length > 0) {
						o.selectedLocation.name = editText;
						hideNameEdit();
						showLocationDetail(o.selectedLocation);
						if (Model.getInstance().currentAppState == Model.appState.eventDetail && o.selectedLocation.locationId && o.selectedLocation.tempId == null) {
							var xmlStr =	'<event id="'+ o.event.eventId +'">';
							xmlStr +=		'<locations>';
							xmlStr +=			o.selectedLocation.xmlForUpdate();
							xmlStr +=		'</locations>';
							xmlStr +=	'</event>';
							var url = domain + "/xml.location.php";
							var params = {registeredId:ruid, xml:xmlStr};
							if (o.event.lastUpdatedTimestamp) params.timestamp = o.event.lastUpdatedTimestamp;
							$.post(url, params, function(data) {
								//handleGetSingleEvent(data);
							});
						}
					}
				}

				function clearSearchResults() {
					o.searchResults = new Array();
					o.newLocations = new Array();
					$this.find('#locationSearchField').addClass('default');
					$this.find('#locationSearchField').val('Search for a location');
					$this.find('#locationDetail').css('display', 'none');
					$this.find('#categoryListContainer').css('display', 'none');
					$this.find('#categoryListContainer').find('.listContent').html('');
				}
				
				function beginSearch() {
					var searchText = $this.find('#locationSearchField').val();
					var searchTextNoWhite = searchText.replace(/ /g,'');
					if (searchTextNoWhite.length == 0 || $this.find('#locationSearchField').hasClass('default')) return;
					var reAddress = new RegExp(/^[0-9]+ .*/);
					console.log(reAddress.test(searchText));
					$this.find('#categoryListContainer').css('display', 'none');
					$this.find('#categoryListContainer').find('.listContent').html('');
					o.searchResults = new Array();
					o.newLocations = new Array();
//					searchSimpleGeo();
					searchYelp(reAddress.test(searchText));
//					searchGoogle();
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
							o.mapBounds = new google.maps.LatLngBounds();
							o.searchResults = new Array();
							console.log(data.features.length);
							if (data.features.length > 0) {
								for (var i in data.features) {
									var feature = data.features[i];
									var loc = new Location();
									loc.populateWithSGFeature(feature);
									if (!o.markers[loc.g_id]) {
										o.searchResults.push(loc);
									}
									var latlng = new google.maps.LatLng(loc.latitude, loc.longitude);
									o.mapBounds.extend(latlng);
								}
								o.map.fitBounds(o.mapBounds);
								o.newSearchResultsDisplay = true;
								placeMarkers();
								o.newSearchResultsDisplay = false;
							} else {
								// Degrade to google
								searchGoogle();
							}
						}
					});
				}
				
				function searchGoogle() {
					var latLngBounds = o.map.getBounds();
					var boundsStr = latLngBounds.getSouthWest().lat()+','+latLngBounds.getSouthWest().lng()+'|'+latLngBounds.getNorthEast().lat()+','+latLngBounds.getNorthEast().lng();
					var searchText = $this.find('#locationSearchField').val();
					var gc = new google.maps.Geocoder();
					console.log(gc);
					gc.geocode({address:searchText, bounds:o.map.getBounds()}, function(data, status) {
						if (status == "OK") {
							console.log(data);
							for (var i=data.length-1; i>=0; i--) {
								var loc = new Location();
								loc.populateWithGoogleResult(data[i]);
								if (!o.markers[loc.g_id]) {
										o.searchResults.push(loc);
								}
								var latlng = new google.maps.LatLng(loc.latitude, loc.longitude);
								o.mapBounds.extend(latlng);
							}
							o.map.fitBounds(o.mapBounds);
							o.newSearchResultsDisplay = true;
							o.startingLocation = o.searchResults[o.searchResults.length-1];
							o.selectedLocation = o.startingLocation;
							showLocationDetail(o.startingLocation);
							console.log(o.searchResults);
							placeMarkers();
							o.newSearchResultsDisplay = false;
						} else {
							alert("No matches found near this location.\nTry another place name or address (or move the map and try again)");
						}
					});
				}
				
				function searchYelp(secondarySearch) {
					var latLngBounds = o.map.getBounds();
					var sw = latLngBounds.getSouthWest();
					var ne = latLngBounds.getNorthEast();
					var boundsStr = sw.lat() +','+ sw.lng() +'|'+ ne.lat() +','+ ne.lng();
					var searchStr = $this.find('#locationSearchField').val();
					
					var url = domain + "/search.yelp.php";
					var params = {registeredId:ruid, term:searchStr, bounds:boundsStr};
					$.get(url, params, function(data) {
						console.log(data);
						for (var i=data.businesses.length-1; i>=0; i--) {
							var loc = new Location();
							loc.populateWithYelpResult(data.businesses[i]);
							if (!o.markers[loc.g_id]) {
									o.searchResults.push(loc);
							}
							var latlng = new google.maps.LatLng(loc.latitude, loc.longitude);
							o.mapBounds.extend(latlng);
						}
						if (!secondarySearch) {
							o.map.fitBounds(o.mapBounds);
							o.newSearchResultsDisplay = true;
							o.startingLocation = o.searchResults[o.searchResults.length-1];
							o.selectedLocation = o.startingLocation;
							showLocationDetail(o.startingLocation);
							placeMarkers();
							o.newSearchResultsDisplay = false;
						} else {
							searchGoogle();
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
					} else if (Model.getInstance().currentAppState == Model.appState.createEvent) {
						loc.locationId = loc.tempId;
						o.event.allLocations.push(loc);
						o.event.locationsVotedFor.push(loc.locationId);
						o.event.currentLocationOrder.unshift(loc.locationId);
						showLocationDetail(o.selectedLocation);
						placeMarkers();
					}
				}

				function toggleVoteForLocation(loc) {
					o.selectedLocation = loc;
					if (Model.getInstance().currentAppState == Model.appState.eventDetail) {
						var xmlStr = '<event id="'+ o.event.eventId +'"><votes><vote locationId="'+ loc.locationId +'" /></votes></event>';
						var url = domain + "/xml.vote.php";
						var params = {registeredId:ruid, xml:xmlStr};
						if (o.lastUpdatedTimestamp) params.timestamp = o.lastUpdatedTimestamp;
						$.post(url, params, function(data) {
							handleGetSingleEvent(data);
						});
					} else if (Model.getInstance().currentAppState == Model.appState.createEvent) {
						var locationId = loc.locationId;
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
						showLocationDetail(o.selectedLocation);
						placeMarkers();
					}
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
				
				function setInitialLocation() {
					Model.getInstance().updateGeoLocation();			
				}
				
				function handleGeoLocationUpdated() {
					o.myLocation = Model.getInstance().getGeoLocation();
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
					if (o.event.allLocations.length == 0) {
						o.map.setCenter(o.myLocation);
//						o.map.panToBounds(o.mapBounds);
						o.map.setZoom(14);
					} else {
						o.map.fitBounds(o.mapBounds);
					}
				}
				
				function handleGeoLocationException() {
					
				}
				
				function setBindings() {
//					$(window).bind('countMeInClick', handleCountMeInClick);
//					$(window).bind('moreButtonClick', handleMoreButtonClick);
					
					$(window).bind('geoLocationUpdated', handleGeoLocationUpdated);
					$(window).bind('geoLocationException', handleGeoLocationException);
				}

/*				function setInitialLocation(resetBounds) {
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
								//if (o.map.getZoom() > 14) o.map.setZoom(14);
								if (!o.originalLocations || o.originalLocations.length == 0) o.map.setZoom(14);
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
						alert("Your browser doesn't support geolocation.");
				//      	callback.initialLocation = siberia;
					}
				//    callback.map.setCenter(initialLocation);
				}
*/				

				
			});
		},		
	};
	
	$.fn.addLocations = function(method) {
	    if (methods[method]) {
			return methods[method].apply(this, Array.prototype.slice.call(arguments, 1));
		} else if (typeof method === 'object' || !method) {
			return methods.init.apply(this, arguments);
		} else {
			$.error('Method ' +  method + ' does not exist on jQuery.addLocations');
		}
	};

})(jQuery);