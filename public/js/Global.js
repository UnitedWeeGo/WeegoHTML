var domain = 'https://api.unitedweego.com'; 
//var domain = 'http://beta.weegoapp.com/public';
var resizeOffset = 44;
var ruid = '';
var canAutoCheckin = null;
var canAutoReportLocation = null;

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
		if (!$.cookie('canAutoCheckin').length) {
			$.cookie({'canAutoCheckin': true});
		}
		canAutoCheckin = ($.cookie('canAutoCheckin') == 'true');
		if (!$.cookie('canAutoReportLocation').length) {
			$.cookie({'canAutoReportLocation': true});
		}
		canAutoReportLocation = ($.cookie('canAutoReportLocation') == 'true');
		console.log($.cookie());
    });
    startAutoCheckinLocationReporting();
}

function appState(state) {
//	if (window.Android) Android.something();
}

function requestFBLoginFromWrapper() {
	if (window.Android) Android.fbLoginRequested();
}

function fbLoginResponse(response, isError) {
	if (isError) {
	
	} else {
		onFBLogin(response);
	}
}

function onFBLogin (token) {
	if (token.length > 0) {
		loginWithFacebookAccessToken(token);
	}
}

function loginWithFacebookAccessToken(token) {
	var url = domain + "/xml.facebook.php";	
	$.post(url, {access_token:token}, handleLoginResponse);
}

function handleLoginResponse(data) {
	if ($(data).find('response').attr('code') == "201") {
		ruid = $(data).find('ruid').text();
		$.cookie('ruid',ruid);
		$.cookie({'canAutoCheckin': true});
		$.cookie({'canAutoReportLocation': true});
		Model.getInstance().createLoginParticipant($(data).find('participant'));
		ViewController.getInstance().showDashboard();
	}
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
	if (canAutoCheckin) {
		console.log('tryAutoCheckin');
		tryAutoCheckin();
	}
	if (canAutoReportLocation) {
		console.log('tryAutoLocationReporting');
		tryAutoLocationReporting();
	}
}

function setCanAutoReportLocation(state) {
	canAutoReportLocation = state;
	$.cookie({'canAutoReportLocation': state});
	var myLocation = Model.getInstance().getGeoLocation();
	reportLocation(myLocation.lat(),myLocation.lng(),state);
}

function setCanAutoCheckin(state) {
	canAutoCheckin = state;
	$.cookie({'canAutoCheckin': state});
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

function reportLocation(lat,lng,disable) {
	var shouldDisable = (disable) ? "true" : "false";
	var url = domain + "/report.location.php";
	$.get(url, {registeredId:ruid, latitude:lat, longitude:lng, disableLocationReporting:shouldDisable}, function(data) {
		handleReportLocationResponse(data);
	});
}

function handleReportLocationResponse(data) {
	if ($(data).find('success')) {
		if (window.Android) Android.handleReportLocationResponse();
	}
}

