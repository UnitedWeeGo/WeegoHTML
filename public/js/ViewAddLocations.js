function AddLocations() {
	this.event = null;
	this.startingLocation = null;
	this.map = null;
	this.client = null;
	
	this.selectedLocation = null;
	this.markers = new Array();
	
	this.originalLocations = new Array();
	this.searchResults = new Array();
	this.newLocations = new Array();
	
	this.initialDisplayFinished = false;
	this.newSearchResultsDisplay = false;
	
	this.markerStateResults = {def:100, selected:101, hasDeal:102};
	this.markerStateAdded = {def:200, selected:201, disabled:202};
	this.markerStateLiked = {def:300, selected:301, disabled:302};
	
	this.initialLocation = null;
}

AddLocations.prototype.init = function(event, locationId) {
	this.event = event;
	
	var myLatlng = null;
	var zoomLevel = 4;
	if (locationId) {
		this.startingLocation = this.event.getLocationById(locationId);
		this.selectedLocation = this.startingLocation;
		myLatlng = new google.maps.LatLng(this.startingLocation.latitude, this.startingLocation.longitude);
		zoomLevel = 12;
	} else {
		myLatlng = new google.maps.LatLng(37.77493,-122.419416);
		zoomLevel = 8;
	}
	var myOptions = {
		zoom: zoomLevel,
		center: myLatlng,
		mapTypeId: google.maps.MapTypeId.ROADMAP
	};
	
	if (this.map) this.map = null;
	this.map = new google.maps.Map(document.getElementById("map_canvas"), myOptions);
	
	this.client = new simplegeo.PlacesClient('dkjJdBSEvxRn4w4LzQj5mZQCVtw4FsYh');
	
	$('#locationDetail').find('.locationInfo').html("");
	
	if (locationId) {
		this.showLocationDetail(this.startingLocation);
	} else {
		this.setInitialLocation();
	}
	
	this.originalLocations = this.event.allLocations.slice();
	
	this.placeMarkers();
	
	this.initialDisplayFinished = true;
	
	this.setEvents();
}

AddLocations.prototype.placeMarkers = function() {
	this.removeMarkers();
	var zIndex = 0;
	for (var i=0; i<this.originalLocations.length; i++) {
		var loc = this.originalLocations[i];
		if (this.markers[loc.g_id]) continue;
		this.markers[loc.g_id] = this.getMarker(loc, zIndex, !this.initialDisplayFinished, this.searchResults.length > 0);
		zIndex++;
	}
	for (var i=0; i<this.newLocations.length; i++) {
		var loc = this.newLocations[i];
		if (this.markers[loc.g_id]) {
			if (!loc.locationId) this.markers[loc.g_id].setMap(null);
			else continue;
		}
		this.markers[loc.g_id] = this.getMarker(loc, zIndex, false, false);
		zIndex++;
	}
	for (var i=0; i<this.searchResults.length; i++) {
		var loc = this.searchResults[i];
		if (this.markers[loc.g_id]) continue;
		this.markers[loc.g_id] = this.getMarker(loc, zIndex, this.newSearchResultsDisplay, false);
		zIndex++;
	}
	
}

// AddLocations.prototype.markerStateResults = {default:100, selected:101, hasDeal:102};
// AddLocations.prototype.markerStateAdded = {default:200, selected:201, disabled:202};
// AddLocations.prototype.markerStateLiked = {default:300, selected:301, disabled:302};

AddLocations.prototype.getMarker = function(loc, zIndex, animated, disabled) {
	var selected = false;
	var notAnimated = false;
	if (loc == this.selectedLocation) selected = true;
	var state = this.markerStateResults.def;
	if (loc.hasDeal) state = this.markerStateResults.hasDeal;
	if (selected) state = this.markerStateResults.selected;
	if (loc.locationId) {
		if (this.event.iVotedFor(loc.locationId)) {
			state = this.markerStateLiked.def;
			if (selected) state = this.markerStateLiked.selected;
			if (disabled) state = this.markerStateLiked.disabled;
		}
		else {
			state = this.markerStateAdded.def;
			if (selected) state = this.markerStateAdded.selected;
			if (disabled) state = this.markerStateAdded.disabled;
		}
	}
	var latlng = new google.maps.LatLng(loc.latitude, loc.longitude);
	var marker = new google.maps.Marker({
		position: latlng,
		map:this.map,
		icon:this.getMarkerImage(state),
		title:loc.name,
		locObject:loc,
		animation: (animated) ? google.maps.Animation.DROP : null
	});
	if (!disabled) {
		var callback = this;
		google.maps.event.addListener(marker, 'click', function() {
			callback.showLocationDetail(this.locObject);
			callback.selectedLocation = this.locObject;
			callback.placeMarkers();
		});
	}
	return marker;
}

AddLocations.prototype.removeMarkers = function() {
	for (var i in this.markers) { //  (var i=0; i<this.markers.length; i++) {
		var marker = this.markers[i];
		// remove 'click' listener ??
		marker.setMap(null);
	}
	this.markers = new Array();
}

AddLocations.prototype.getMarkerImage = function(state) {
	var url = '/assets/images/app/';
	switch (state) {
		case 	this.markerStateAdded.def :
				url += 'POIs_place_default_sm.png';
				break;
		case 	this.markerStateAdded.selected :
				url += 'POIs_place_selected_sm.png';
				break;
		case 	this.markerStateAdded.disabled :
				url += 'POIs_place_disabled_sm.png';
				break;
		case 	this.markerStateLiked.def :
				url += 'POIs_liked_default_sm.png';
				break;
		case 	this.markerStateLiked.selected :
				url += 'POIs_liked_selected_sm.png';
				break;
		case 	this.markerStateLiked.disabled :
				url += 'POIs_liked_disabled_sm.png';
				break;
		case 	this.markerStateResults.def :
				url += 'POIs_search_default.png';
				break;
		case 	this.markerStateResults.selected :
				url += 'POIs_search_selected.png';
				break;
		case 	this.markerStateResults.hasDeal :
				url += 'POIs_deal_default.png';
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
	return image;									
}

AddLocations.prototype.setEvents = function() {
	var callback = this;
	$('#addLocation').find('.backButton').unbind('click');
	$('#addLocation').find('.backButton').click(function() {
		ViewController.getInstance().showEventDetail(callback.event.eventId);
	});
	$('#locationSearch').find('#submit').unbind('click');
	$('#locationSearch').find('#submit').click(function() {
		callback.searchSimpleGeo();
	});
}

AddLocations.prototype.showLocationDetail = function(loc) {
	$('#locationDetail').find('.locationInfo').html("");
	$('#locationDetail').find(".voteButton").removeClass("iVotedFor");
	$('#locationDetail').find(".voteButton").removeClass("notVotedFor");
	$('#locationDetail').find(".voteButton").unbind('click');
	var iVotedFor = this.event.iVotedFor(loc.locationId);
	$('#locationDetail').find('.locationInfo').append(loc.displayForLocationDetail());
	var callback = this;
	if (!loc.locationId) {
		$('#locationDetail').find(".voteButton").click(function() {
			callback.addLocation(loc);
		});
	} else { 
		if (iVotedFor) $('#locationDetail').find(".voteButton").addClass("iVotedFor");
		else $('#locationDetail').find(".voteButton").addClass("notVotedFor");
		$('#locationDetail').find(".voteButton").click(function() {
			callback.toggleVoteForLocation(loc);
		});
	}
}

AddLocations.prototype.clearSearchResults = function() {
	
}

AddLocations.prototype.searchSimpleGeo = function() {
	this.originalLocations = this.event.allLocations.slice();
	this.newLocations = new Array();
	var searchText = $('#locationSearchField').val();
	var latlng = this.map.getCenter();
	var lat = latlng.lat();
	var lng = latlng.lng();
	var callback = this;
	this.client.search(lat, lng, {q:searchText}, function(err, data) {
		if (err) {
			alert(err);
		} else {
			callback.searchResults = new Array();
			for (var i in data.features) {
				var feature = data.features[i];
				var loc = new Location();
				loc.populateWithSGFeature(feature);
				if (!callback.markers[loc.g_id]) callback.searchResults.push(loc);
			}
			callback.newSearchResultsDisplay = true;
			callback.placeMarkers();
			callback.newSearchResultsDisplay = false;
		}
	});
}

AddLocations.prototype.addLocation = function(loc) {
	this.selectedLocation = loc;
	loc.tempId = this.guidGenerator();
	var xmlStr =	'<event id="'+ this.event.eventId +'">'+
						'<locations>'+
							'<location tempId="'+ loc.tempId +'" latitude="'+ loc.latitude +'" longitude="'+ loc.longitude +'">'+
								'<name>'+ loc.name +'</name>'+
								'<vicinity>'+ loc.vicinity +'</vicinity>'+
								'<g_id>'+ loc.g_id +'</g_id>'+
								'<g_reference></g_reference>'+
								'<location_type>'+ loc.locationType +'</location_type>'+
								'<formatted_address>'+ loc.formatted_address +'</formatted_address>'+
								'<formatted_phone_number>'+ loc.formatted_phone_number +'</formatted_phone_number>'+
							'</location>'+
						'</locations>'+
					'</event>';
	var url = domain + "/xml.location.php";
	var callback = this;
	var params = {registeredId:ruid, xml:xmlStr};
	if (this.event.lastUpdatedTimestamp) params.timestamp = this.event.lastUpdatedTimestamp;
	$.post(url, params, function(data) {
		callback.handleGetSingleEvent(data);
	});
}

AddLocations.prototype.toggleVoteForLocation = function(loc) {
	this.selectedLocation = loc;
	var xmlStr = '<event id="'+ this.event.eventId +'"><votes><vote locationId="'+ loc.locationId +'" /></votes></event>';
	var url = domain + "/xml.vote.php";
	var callback = this;
	var params = {registeredId:ruid, xml:xmlStr};
	if (this.lastUpdatedTimestamp) params.timestamp = this.lastUpdatedTimestamp;
	$.post(url, params, function(data) {
		callback.handleGetSingleEvent(data);
	});
}

AddLocations.prototype.guidGenerator = function() {
    var S4 = function() {
       return (((1+Math.random())*0x10000)|0).toString(16).substring(1);
    };
    return (S4()+S4()+"-"+S4()+"-"+S4()+"-"+S4()+"-"+S4()+S4()+S4());
}

AddLocations.prototype.handleGetSingleEvent = function(data) {
	this.lastUpdatedTimestamp = $(data).find('response').attr('timestamp');
	var allEventsXML = $(data).find('event');
	for (var i=0; i<allEventsXML.length; i++) {
		var evXML = allEventsXML[i];
 		if (!this.event) this.event = new Event();
 		this.event.lastUpdatedTimestamp = $(data).find('response').attr('timestamp');
 		this.event.populateWithXML(evXML);
	}
	this.newLocations = new Array();
	for (var i=0; i<this.event.allLocations.length; i++) {
		var loc1 = this.event.allLocations[i];
		var found = false;
		for (var j=0; j<this.originalLocations.length; j++) {
			var loc2 = this.originalLocations[j];
			if (loc1.g_id == loc2.g_id) {
				found = true;
			}
		}
		if (!found) this.newLocations.push(loc1);
	}
	if (!this.selectedLocation.locationId) this.selectedLocation = this.event.getOfficialLocationByTempId(this.selectedLocation.tempId);
	this.showLocationDetail(this.selectedLocation);
	this.placeMarkers();
}

AddLocations.prototype.setInitialLocation = function() {
	var browserSupportFlag = new Boolean();
	var callback = this;
	
	// Try W3C Geolocation (Preferred)
	if (navigator.geolocation) {
		alert("w3c");
		browserSupportFlag = true;
		navigator.geolocation.getCurrentPosition(function(position) {
			callback.initialLocation = new google.maps.LatLng(position.coords.latitude,position.coords.longitude);
			callback.map.setCenter(callback.initialLocation);
		}, function() {
	  		callback.handleNoGeolocation(browserSupportFlag);
		});
	// Try Google Gears Geolocation
	} else if (google.gears) {
		alert("google");
		browserSupportFlag = true;
		var geo = google.gears.factory.create('beta.geolocation');
		geo.getCurrentPosition(function(position) {
	  		callback.initialLocation = new google.maps.LatLng(position.latitude,position.longitude);
	  		callback.map.setCenter(callback.initialLocation);
		}, function() {
	  		callback.handleNoGeoLocation(browserSupportFlag);
		});
	// Browser doesn't support Geolocation
	} else {
		browserSupportFlag = false;
		callback.handleNoGeolocation(browserSupportFlag);
	}
}

AddLocations.prototype.handleNoGeolocation = function(errorFlag) {
    if (errorFlag == true) {
      	alert("Geolocation service failed.");
//      	callback.initialLocation = newyork;
    } else {
      	alert("Your browser doesn't support geolocation. We've placed you in Siberia.");
//      	callback.initialLocation = siberia;
    }
//    callback.map.setCenter(initialLocation);
}
