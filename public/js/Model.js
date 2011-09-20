// Model

function Model() {
	this.loginParticipant = null;
	this.currentEvent = null;
	this.currentAppState = null;
}

Model.appState = {login:100, dashboard:200, eventDetail:300, createEvent:400};

Model.prototype.createLoginParticipant = function(xml) {
	this.loginParticipant = new Participant();
	this.loginParticipant.populateWithXML(xml);
	$.cookie({
		'firstName': this.loginParticipant.firstName,
		'lastName': this.loginParticipant.lastName,
		'email': this.loginParticipant.email,
		'avatarURL': escape(this.loginParticipant.avatarURL)
	});
}

Model.prototype.createLoginParticipantFromCookie = function() {
	this.loginParticipant = new Participant();
	this.loginParticipant.firstName = $.cookie('firstName');
	this.loginParticipant.lastName = $.cookie('lastName');
	this.loginParticipant.email = $.cookie('email');
	this.loginParticipant.avatarURL = unescape($.cookie('avatarURL'));
}

Model.prototype.removeLoginParticipant = function(xml) {
	this.loginParticipant = null;
	$.cookie({
		'firstName': null,
		'lastName': null,
		'email': null,
		'avatarURL': null
	});
}

Model.prototype.createNewEvent = function() {
	this.currentEvent = new Event();
	this.currentEvent.eventId = guidGenerator();
	this.currentEvent.creatorParticipant = this.loginParticipant;
	this.currentEvent.allParticipants.push(this.loginParticipant);
	this.currentEvent.eventDate = new Date();
	this.currentEvent.isTemporary = true;
	return this.currentEvent;
}

Model.instance = null;

Model.getInstance = function() {
	if (Model.instance == null) Model.instance = new Model();
	return Model.instance;
}