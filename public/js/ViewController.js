function ViewController() {
	this.dashboard = null;
	this.eventDetail = null;
	this.addLocations = null;
}

ViewController.prototype.showDashboard = function() {
	$('#dashboard').css("display", "block");
	$('#eventDetail').css("display", "none");
	$('#addLocation').css("display", "none");
	if (!this.dashboard) this.dashboard = new Dashboard();
	this.dashboard.init();
}

ViewController.prototype.showEventDetail = function(eventId) {
	$('#dashboard').css("display", "none");
	$('#eventDetail').css("display", "block");
	$('#addLocation').css("display", "none");
	if (this.eventDetail) delete this.eventDetail;
	this.eventDetail = new EventDetail();
	this.eventDetail.init(eventId);
}

ViewController.prototype.showAddLocations = function(event, locationId) {
	$('#dashboard').css("display", "none");
	$('#eventDetail').css("display", "none");
	$('#addLocation').css("display", "block");
	if (this.addLocations) delete this.addLocations;
	this.addLocations = new AddLocations();
	this.addLocations.init(event, locationId);
}

ViewController.instance = null;

ViewController.getInstance = function() {
	if (ViewController.instance == null) {
		ViewController.instance = new ViewController();
	}
	return ViewController.instance;
}