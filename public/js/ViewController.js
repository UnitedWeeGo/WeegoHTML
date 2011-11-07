function ViewController() {

}

ViewController.prototype.showView = function(state, eventId) {
	var test = state == Model.appState.eventDetail;
	var stateInt = parseInt(state);
	switch (stateInt) {
		case Model.appState.login :
			this.showLogin();
			break;
		case Model.appState.eventDetail :
			this.showEventDetail(eventId);
			break;
		default :
			this.showDashboard();
			break;
	}
}

ViewController.prototype.showLogin = function() {
	Model.getInstance().currentAppState = Model.appState.login;
	$.cookie({'state': Model.getInstance().currentAppState, 'eventId': null});
	Model.getInstance().currentEvent = null;
	$('#login').css("display", "block");
	$('#navBar').css("display", "none");
	$('#dashboard').css("display", "none");
	$('#eventDetail').css("display", "none");
	$('#addLocations').css("display", "none");
	$('#addFriends').css("display", "none");
	$('#messages').css("display", "none");
	$('#createEvent').css("display", "none");
	$('#prefs').css("display", "none");
	$('#login').login();
	$('#homeBackground').css('opacity',1);
}

ViewController.prototype.showDashboard = function() {
	Model.getInstance().currentAppState = Model.appState.dashboard;
	$.cookie({'state': Model.getInstance().currentAppState, 'eventId': null});
	Model.getInstance().currentEvent = null;
	$('#login').css("display", "none");
	$('#navBar').css("display", "block");
	$('#dashboard').css("display", "block");
	$('#eventDetail').css("display", "none");
	$('#addLocations').css("display", "none");
	$('#addFriends').css("display", "none");
	$('#messages').css("display", "none");
	$('#createEvent').css("display", "none");
	$('#prefs').css("display", "none");
	$('#dashboard').dashboard();
	$('#homeBackground').css('opacity',1);
	$('#navBar').navBar('dashboard');
	$('#navBar').find('.prefsButton').unbind('click');
	$('#navBar').find('.prefsButton').click(function() {
		ViewController.getInstance().showPrefs();
	});
	$('#navBar').find('.addButton').unbind('click');
	$('#navBar').find('.addButton').click(function() {
		ViewController.getInstance().showCreateEvent();
	});
}

ViewController.prototype.showEventDetail = function(eventId, reset, showCountMeInButton, skipReload) {
	Model.getInstance().currentAppState = Model.appState.eventDetail;
	$.cookie({'state': Model.getInstance().currentAppState, 'eventId': eventId});
	$('#login').css("display", "none");
	$('#navBar').css("display", "block");
	$('#dashboard').css("display", "none");
	$('#eventDetail').css("display", "block");
	$('#addLocations').css("display", "none");
	$('#addFriends').css("display", "none");
	$('#messages').css("display", "none");
	$('#createEvent').css("display", "none");
	$('#prefs').css("display", "none");
	if (!skipReload) $('#eventDetail').eventDetail({eventId:eventId, reset:reset});
	$('#homeBackground').css('opacity',0);
	if (showCountMeInButton) $('#navBar').navBar('eventDetailCountMeIn');
	else $('#navBar').navBar('eventDetail');
	$('#navBar').find('.backButton').unbind('click');
	$('#navBar').find('.backButton').click(function() {
		ViewController.getInstance().showDashboard();
	});
}

ViewController.prototype.showAddLocations = function(locationId) {
	$('#login').css("display", "none");
	$('#navBar').css("display", "block");
	$('#dashboard').css("display", "none");
	$('#eventDetail').css("display", "none");
	$('#addLocations').css("display", "block");
	$('#addFriends').css("display", "none");
	$('#messages').css("display", "none");
	$('#createEvent').css("display", "none");
	$('#prefs').css("display", "none");
	$('#addLocations').addLocations({event:Model.getInstance().currentEvent, locationId:locationId});
	$('#navBar').navBar('addLocations');
	$('#navBar').find('.backButton').unbind('click');
	$('#navBar').find('.backButton').click(function() {
		if (Model.getInstance().currentAppState == Model.appState.createEvent) {
			ViewController.getInstance().showCreateEvent();
		} else {
			ViewController.getInstance().showEventDetail(Model.getInstance().currentEvent.eventId);
		}
	});
}

ViewController.prototype.showAddFriends = function() {
	$('#login').css("display", "none");
	$('#navBar').css("display", "block");
	$('#dashboard').css("display", "none");
	$('#eventDetail').css("display", "none");
	$('#addLocations').css("display", "none");
	$('#addFriends').css("display", "block");
	$('#messages').css("display", "none");
	$('#createEvent').css("display", "none");
	$('#prefs').css("display", "none");
	$('#addFriends').addFriends({event:Model.getInstance().currentEvent});
	$('#navBar').navBar('addFriends');
	$('#navBar').find('.backButton').unbind('click');
	$('#navBar').find('.backButton').click(function() {
		if (Model.getInstance().currentAppState == Model.appState.createEvent) {
			ViewController.getInstance().showCreateEvent();
		} else {
			ViewController.getInstance().showEventDetail(Model.getInstance().currentEvent.eventId);
		}
	});
	
	$('#navBar').find('.doneButton').click(function() {
		$('#addFriends').addFriends('done');
	});
}

ViewController.prototype.showMessages = function(eventId) {
	$('#messages').css("display", "block");
	$('#messages').messages({event:Model.getInstance().currentEvent});
}

ViewController.prototype.hideMessages = function() {
	var ev = Model.getInstance().currentEvent;
	this.showEventDetail(ev.eventId, true, ev.showCountMeIn());
}

ViewController.prototype.showCreateEvent = function() {
	Model.getInstance().currentAppState = Model.appState.createEvent;
	$.cookie({'state': null, 'eventId': null});
	$('#login').css("display", "none");
	$('#navBar').css("display", "block");
	$('#dashboard').css("display", "none");
	$('#eventDetail').css("display", "none");
	$('#addLocations').css("display", "none");
	$('#addFriends').css("display", "none");
	$('#messages').css("display", "none");
	$('#createEvent').css("display", "block");
	$('#prefs').css("display", "none");
	$('#createEvent').createEvent();
	$('#homeBackground').css('opacity',0);
	$('#navBar').navBar('createEvent');
	$('#navBar').find('.backButton').unbind('click');
	$('#navBar').find('.backButton').click(function() {
		ViewController.getInstance().showDashboard();
	});
	$('#navBar').find('.doneButton').click(function() {
		$('#createEvent').createEvent('done');
	});
}

ViewController.prototype.showPrefs = function() {
	Model.getInstance().currentAppState = Model.appState.prefs;
	$.cookie({'state': null, 'eventId': null});
	$('#login').css("display", "none");
	$('#navBar').css("display", "block");
	$('#dashboard').css("display", "none");
	$('#eventDetail').css("display", "none");
	$('#addLocations').css("display", "none");
	$('#addFriends').css("display", "none");
	$('#messages').css("display", "none");
	$('#createEvent').css("display", "none");
	$('#prefs').css("display", "block");
	$('#prefs').prefs();
	$('#homeBackground').css('opacity',1);
	$('#navBar').navBar('prefs');
	$('#navBar').find('.backButton').unbind('click');
	$('#navBar').find('.backButton').click(function() {
		ViewController.getInstance().showDashboard();
	});
}

ViewController.instance = null;

ViewController.getInstance = function() {
	if (ViewController.instance == null) {
		ViewController.instance = new ViewController();
	}
	return ViewController.instance;
}