// Model

function Model() {
	this.loginParticipant = null;
	this.currentEvent = null;
	this.currentAppState = null;
	this.allEvents = new Array();
}

Model.appState = {login:100, dashboard:200, eventDetail:300, createEvent:400, prefs:500};

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

Model.prototype.populateEventsWithXML = function(data) {
	var allEventsXML = $(data).find('event');
	for (var i=0; i<allEventsXML.length; i++) {
		var evXML = allEventsXML[i];
		var id = $(evXML).attr('id');
		var ev = this.getEventById(id);
		if (!ev) {
			ev = new Event();
			this.allEvents.push(ev);
		}
		ev.populateWithXML(evXML);
	}
}

Model.prototype.getEventById = function(id) {
	for (var i=0; i<this.allEvents.length; i++) {
		var ev = this.allEvents[i];
		if (ev.eventId == id) return ev;
	}
	return null;
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

Model.prototype.getModelDataAsJSON = function() {
	var filteredData = '{"ruid":"'+ ruid +'", events:[';
	var acceptedEvents = 0;
	for (var i=0; i<this.allEvents.length; i++) {
		var ev = this.allEvents[i];
		if (ev.didAcceptEvent() && ev.allLocations.length > 0) {
			acceptedEvents++;
			filteredData += ev.getJSON() +",";
		}
	}
	if (acceptedEvents > 0) filteredData = filteredData.substring(0,filteredData.length-1);
	filteredData += ']}';
	console.log(filteredData);
	var obj = eval('(' + filteredData + ')');
	console.log(obj);
	sendModel(filteredData);
}

Model.prototype.clear = function() {
	delete Model.instance;
}

Model.instance = null;

Model.getInstance = function() {
	if (Model.instance == null) Model.instance = new Model();
	return Model.instance;
}