var domain = 'https://api.unitedweego.com'; 
//var domain = 'http://beta.weegoapp.com/public';
var resizeOffset = 44;
var ruid = '';

window.onresize = function() {
//	ViewController.getInstance().resizeViews();
//	ViewController.getInstance().resetScroll();
}

window.onload = function () {
	
    jQuery(document).ready( function($) {
    	if ($.cookie('ruid').length) {
    		ruid = $.cookie('ruid');
    		var state = ($.cookie('state').length) ? $.cookie('state') : null;
    		var eventId = ($.cookie('eventId').length) ? $.cookie('eventId') : null;
    		Model.getInstance().createLoginParticipantFromCookie();
    		ViewController.getInstance().showView(state, eventId);
    	} else {
    		var head = document.getElementsByTagName('head')[0];
    		var fb_js = document.createElement('script');
    		fb_js.async = true;
  			fb_js.type = 'text/javascript';
  			fb_js.src = document.location.protocol + '//connect.facebook.net/en_US/all.js';
			head.appendChild(fb_js);
			ViewController.getInstance().showView(Model.appState.login, null);
		}
    });
    startAutoCheckinLocationReporting();
}

function appState(state) {
//	if (Android) Android.something();
}

function fetchData() {
	var url = domain + "/get.event.dashboard.php";
	$.get(url, {registeredId:ruid}, function(data) {
		handleFetchDataResponse(data);
	});
}

function handleFetchDataResponse(data) {
	Model.getInstance().populateEventsWithXML(data);
	Model.getInstance().getModelDataAsJSON();
}

function sendModel(JSON) {
	if (window.Android) Android.refreshModel(JSON);
}

var checkinReportLocationInt = null;

function startAutoCheckinLocationReporting() {
	reportLocationInt = setInterval(checkinAndReportLocation, 60000);
}

function checkinAndReportLocation() {
	Model.getInstance().updateGeoLocation();
	// Make prefs for these
	tryAutoCheckin();
	tryAutoLocationReporting();
}

function tryAutoCheckin() {
	var model = Model.getInstance();
	var eventsToCheckin = new Array();
	for (var i=0; i<model.allEvents.length; i++) {
		var ev = model.allEvents[i];
		if (ev.eligibleForCheckin(true)) {
			eventsToCheckin.push(ev);
		}
	}
	console.log("eventsToCheckin: "+ eventsToCheckin.length);
	for (var i=0; i<eventsToCheckin.length; i++) {
		var ev = eventsToCheckin[i];
		checkIn(ev.eventId);
	}
}

function tryAutoLocationReporting() {
	var model = Model.getInstance();
	for (var i=0; i<model.allEvents.length; i++) {
		var ev = model.allEvents[i];
		if (ev.eligibleForLocationReporting()) {
			var myLocation = model.getGeoLocation();
			reportLocation(myLocation.lat(),myLocation.lng());
			console.log("AutoLocationReporting");
			break;
		}
	}
}

function checkIn(eventId) {
	var ev = Model.getInstance().getEventById(eventId);
	var loc = ev.getWinningLocation();
	var url = domain + "/checkin.php";
	$.get(url, {registeredId:ruid, eventId:eventId, locationId:loc.locationId}, function(data) {
		handleCheckInResponse(data);
	});
}

function handleCheckInResponse(data) {
	if ($(data).find('success')) {
		var eventId = $(data).find('success').attr('id');
		var ev = Model.getInstance().getEventById(eventId);
		ev.hasBeenCheckedIn = true;
		Model.getInstance().getModelDataAsJSON();
		if (window.Android) Android.handleCheckInResponse();
	}
}

function reportLocation(lat,lng) {
	var url = domain + "/report.location.php";
	$.get(url, {registeredId:ruid, latitude:lat, longitude:lng, disableLocationReporting:"false"}, function(data) {
		handleReportLocationResponse(data);
	});
}

function handleReportLocationResponse(data) {
	if ($(data).find('success')) {
		if (window.Android) Android.handleReportLocationResponse();
	}
}

