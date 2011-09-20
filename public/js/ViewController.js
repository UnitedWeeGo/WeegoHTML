function ViewController() {

}

ViewController.prototype.showView = function(state, eventId) {
	var test = state == Model.appState.eventDetail;
	var stateInt = parseInt(state);
	switch (stateInt) {
		case Model.appState.eventDetail :
			this.showEventDetail(eventId);
			break;
		default :
			this.showDashboard();
			break;
	}
}

ViewController.prototype.showDashboard = function() {
	Model.getInstance().currentAppState = Model.appState.dashboard;
	$.cookie({'state': Model.getInstance().currentAppState, 'eventId': null});
	Model.getInstance().currentEvent = null;
	$('#navBar').css("display", "block");
	$('#dashboard').css("display", "block");
	$('#eventDetail').css("display", "none");
	$('#addLocations').css("display", "none");
	$('#createEvent').css("display", "none");
	$('#dashboard').dashboard();
	$('#homeBackground').css('opacity',1);
	$('#navBar').navBar('dashboard');
	$('#navBar').find('.addButton').unbind('click');
	$('#navBar').find('.addButton').click(function() {
		ViewController.getInstance().showCreateEvent();
	});
}

ViewController.prototype.showEventDetail = function(eventId, reset) {
	Model.getInstance().currentAppState = Model.appState.eventDetail;
	$.cookie({'state': Model.getInstance().currentAppState, 'eventId': eventId});
	$('#navBar').css("display", "block");
	$('#dashboard').css("display", "none");
	$('#eventDetail').css("display", "block");
	$('#addLocations').css("display", "none");
	$('#createEvent').css("display", "none");
	$('#eventDetail').eventDetail({eventId:eventId, reset:reset});
	$('#homeBackground').css('opacity',0);
	$('#navBar').navBar('eventDetail');
	$('#navBar').find('.backButton').unbind('click');
	$('#navBar').find('.backButton').click(function() {
		ViewController.getInstance().showDashboard();
	});
}

ViewController.prototype.showAddLocations = function(locationId) {
	$('#navBar').css("display", "block");
	$('#dashboard').css("display", "none");
	$('#eventDetail').css("display", "none");
	$('#addLocations').css("display", "block");
	$('#createEvent').css("display", "none");
	$('#addLocations').addLocations({event:Model.getInstance().currentEvent, locationId:locationId});
	$('#navBar').navBar();
	$('#navBar').find('.backButton').unbind('click');
	$('#navBar').find('.backButton').click(function() {
		if (Model.getInstance().currentAppState == 'createEvent') {
			ViewController.getInstance().showCreateEvent();
		} else {
			ViewController.getInstance().showEventDetail(Model.getInstance().currentEvent.eventId);
		}
	});
}

ViewController.prototype.showCreateEvent = function() {
	Model.getInstance().currentAppState = Model.appState.createEvent;
	$.cookie({'state': null, 'eventId': null});
	$('#navBar').css("display", "block");
	$('#dashboard').css("display", "none");
	$('#eventDetail').css("display", "none");
	$('#addLocations').css("display", "none");
	$('#createEvent').css("display", "block");
	$('#createEvent').createEvent();
	$('#homeBackground').css('opacity',0);
	$('#navBar').navBar('createEvent');
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