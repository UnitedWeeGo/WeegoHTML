var domain = 'http://beta.weegoapp.com/public';
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

