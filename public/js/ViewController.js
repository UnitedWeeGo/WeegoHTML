function ViewController() {

}

ViewController.prototype.showDashboard = function() {
	$('#dashboard').css("display", "block");
	$('#eventDetail').css("display", "none");
	$('#addLocations').css("display", "none");
	$('#dashboard').dashboard();
	$('#homeBackground').css('opacity',1);
}

ViewController.prototype.showEventDetail = function(eventId, reset) {
	$('#dashboard').css("display", "none");
	$('#eventDetail').css("display", "block");
	$('#addLocations').css("display", "none");
	$('#eventDetail').eventDetail({eventId:eventId, reset:reset});
	$('#homeBackground').css('opacity',0);
	$('#navBar').find('.backButton').unbind('click');
	$('#navBar').find('.backButton').click(function() {
		ViewController.getInstance().showDashboard();
	});
}

ViewController.prototype.showAddLocations = function(event, locationId) {
	$('#dashboard').css("display", "none");
	$('#eventDetail').css("display", "none");
	$('#addLocations').css("display", "block");
	$('#addLocations').addLocations({event:event, locationId:locationId});
	$('#navBar').find('.backButton').unbind('click');
	$('#navBar').find('.backButton').click(function() {
		ViewController.getInstance().showEventDetail(event.eventId);
	});
}

ViewController.instance = null;

ViewController.getInstance = function() {
	if (ViewController.instance == null) {
		ViewController.instance = new ViewController();
	}
	return ViewController.instance;
}