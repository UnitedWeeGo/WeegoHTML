var domain = 'https://api.unitedweego.com'; 
//var domain = 'http://beta.weegoapp.com/public';
var resizeOffset = 0; //45;
var ruid = '';
var canAutoCheckin = null;
var canAutoReportLocation = null;
var model = null;

window.onresize = function() {
//	ViewController.getInstance().resizeViews();
//	ViewController.getInstance().resetScroll();
}

window.onload = function () {
	model = Model.getInstance();
	hideAddressBar();
    jQuery(document).ready( function($) {
    	if ($.cookie('ruid').length) {
    		ruid = $.cookie('ruid');
    		var state = ($.cookie('state').length) ? $.cookie('state') : null;
    		var eventId = ($.cookie('eventId').length) ? $.cookie('eventId') : null;
    		model.createLoginParticipantFromCookie();
    		ViewController.getInstance().showView(state, eventId);
    	} else {
    		if (!window.Android) {
    			console.log("loading facebook");
				var head = document.getElementsByTagName('head')[0];
				var fb_js = document.createElement('script');
				fb_js.async = true;
				fb_js.type = 'text/javascript';
				fb_js.src = document.location.protocol + '//connect.facebook.net/en_US/all.js';
				head.appendChild(fb_js);
			}
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
    });
    if (ruid.length > 0) startAutoCheckinLocationReporting();
}

function hideAddressBar() {
	setTimeout(function() {
		window.scrollTo(0, 1);
		$("HTML").css('height', window.innerHeight);
		$("#homeBackground").css('height', window.innerHeight);
		var navBarHeight = $("#navBar").height();
		$("#contentFrame").css('height', window.innerHeight - navBarHeight);
	}, 100);
	setPageContainerScroll();
}

function setPageContainerScroll() {
	if (!!('ontouchstart' in window)) {
		$('#pageContainer').touchScroll();
	}
}

function updatePageContainerScroll() {
	if (!!('ontouchstart' in window)) {
		$('#pageContainer').touchScroll('update');
	}
}

function appState(state) {
//	if (window.Android) Android.something();
}

function requestFBLoginFromWrapper() {
	if (window.Android) Android.fbLoginRequested();
}

function reportLogoutToWrapper() {
	console.log("reportLogoutToWrapper fbLogoutRequested()");
	if (window.Android) Android.fbLogoutRequested();
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
		model.createLoginParticipant($(data).find('participant'));
		ViewController.getInstance().showDashboard();
	}
	if (ruid.length > 0) startAutoCheckinLocationReporting();
}

function fetchData() {
	var url = domain + "/get.event.dashboard.php";
	$.get(url, {registeredId:ruid}, function(data) {
		handleFetchDataResponse(data);
	});
}

function handleFetchDataResponse(data) {
	model.populateEventsWithXML(data);
	model.getModelDataAsJSON();
}

function sendModel(JSON) {
	if (window.Android) Android.refreshModel(JSON);
}

var checkinReportLocationInt = null;

function startAutoCheckinLocationReporting() {
	reportLocationInt = setInterval(checkinAndReportLocation, 60000);
}

function checkinAndReportLocation() { 
	model.updateGeoLocation(true);
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
	var myLocation = model.getGeoLocation();
	reportLocation(myLocation.lat(),myLocation.lng(),state);
}

function setCanAutoCheckin(state) {
	canAutoCheckin = state;
	$.cookie({'canAutoCheckin': state});
}

function tryAutoCheckin() {
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
	var ev = model.getEventById(eventId);
	var loc = ev.getWinningLocation();
	var url = domain + "/checkin.php";
	$.get(url, {registeredId:ruid, eventId:eventId, locationId:loc.locationId}, function(data) {
		handleCheckInResponse(data);
	});
}

function handleCheckInResponse(data) {
	if ($(data).find('success')) {
		var eventId = $(data).find('success').attr('id');
		var ev = model.getEventById(eventId);
		ev.hasBeenCheckedIn = true;
		model.getModelDataAsJSON();
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

