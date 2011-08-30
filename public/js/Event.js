// Event VO

function Event() {
	this.eventId = '';
	this.eventTitle = '';
	this.eventDate = '';
	this.eventExpireDate = '';
	this.creatorId = '';
	this.acceptedParticipantList = '';
	this.declinedParticipantList = '';
	this.topLocationId = null;
	this.participantCount = '';
	this.unreadMessageCount = '';
	this.eventRead = false;
	this.hasBeenCheckedIn = false;
	
	this.allLocations = [];
	this.allParticipants = [];
	
	this.currentLocationOrder = [];
	this.locationsVotedFor = [];
	
	this.creatorParticipant = null;
	
	this.lastUpdatedTimestamp = null;
}

Event.prototype.populateWithXML = function(xml) {
	if ($(xml).attr('id').length) this.eventId = $(xml).attr('id');
	if ($(xml).find('eventTitle').text().length) this.eventTitle = $(xml).find('eventTitle').text();
	if ($(xml).find('eventInfo').attr('eventDate')) this.eventDate = new Date($(xml).find('eventInfo').attr('eventDate'));
	if ($(xml).find('eventInfo').attr('eventExpireDate')) this.eventExpireDate = new Date($(xml).find('eventInfo').attr('eventExpireDate'));
	if ($(xml).find('creatorId').text().length) this.creatorId = $(xml).find('creatorId').text();
	if ($(xml).find('acceptedParticipantList').text().length) this.acceptedParticipantList = $(xml).find('acceptedParticipantList').text();
	if ($(xml).find('declinedParticipantList').text().length) this.declinedParticipantList = $(xml).find('declinedParticipantList').text();
	if ($(xml).find('eventInfo').attr('topLocationId')) this.topLocationId = $(xml).find('eventInfo').attr('topLocationId');
	if ($(xml).find('eventInfo').attr('count')) this.participantCount = $(xml).find('eventInfo').attr('count');
	if ($(xml).find('feedMessages').attr('unreadMessageCount').length) this.unreadMessageCount = $(xml).find('feedMessages').attr('unreadMessageCount');
	if ($(xml).find('eventInfo').attr('hasBeenRead')) this.eventRead = ($(xml).find('eventInfo').attr('hasBeenRead') == "true");
	if ($(xml).find('eventInfo').attr('hasCheckedIn')) this.hasBeenCheckedIn = ($(xml).find('eventInfo').attr('hasCheckedIn') == "true");
	if ($(xml).find('locationOrder').attr('order')) this.currentLocationOrder = $(xml).find('locationOrder').attr('order').split(",");
	if ($(xml).find('iVotedFor').attr('locations') || $(xml).find('iVotedFor').attr('locations') == "") this.locationsVotedFor = $(xml).find('iVotedFor').attr('locations').split(",");
	
	var callback = this;
	$(xml).find('location').each(function() {
		var loc = new Location();
		loc.populateWithXML(this);
		callback.allLocations.push(loc);
	});
	
	$(xml).find('participant').each(function() {
		var p = new Participant();
		p.populateWithXML(this);
		callback.allParticipants.push(p);
	});
	
	this.creatorParticipant = this.getParticipantById(this.creatorId);
}

Event.prototype.displayForDashboard = function() {
	var winningLocation = this.getLocationById(this.topLocationId);
	var locHtml = (winningLocation) ? winningLocation.displayForLocationDetail() : ''
	var output = 	'<li class="dashboardEvent" eventId="'+ this.eventId +'">' +
 						'<img class="userAvatar" src="'+ this.creatorParticipant.avatarURL +'" />'+
 						'<p>'+ this.creatorParticipant.getFullName() +'</p>'+
						'<h2>'+ this.eventTitle +'</h2>'+
						'<p>'+ this.getFormattedDate() +'</p>'+
						locHtml +
					'</li>';
	return output;
}

Event.prototype.displayForEventDetail = function() {
	var output =	'<div class="eventInfo">';
		output +=		'<img class="userAvatar" src="'+ this.creatorParticipant.avatarURL +'" />';
		output +=		'<div class="content">';
		output +=			'<p>'+ this.creatorParticipant.getFullName() +'</p>';
		output +=			'<h2>'+ this.eventTitle +'</h2>';
		output +=			'<p>'+ this.getFormattedDate() +'</p>';
		if (this.getEventState() < Event.state.decided) {
			if (this.getEventState() == Event.state.votingWarning) {
				output +=	'<p>Voting ends in '+ this.minutesToGoUntilVotingEnds() +' minutes</p>';
			} else {
				output +=	'<p>Voting is open</p>';
			}
		}
		output += 		'</div>';
		output += 	'</div>';
		output +=	this.locationList();
		output +=	this.participantList();
	return output;
}

Event.prototype.locationList = function() {
	var output = '<ul class="locationList">';
	for (var i=0; i<this.currentLocationOrder.length; i++) {
		for (var j=0; j<this.allLocations.length; j++) {
			var loc = this.allLocations[j];
			if (loc.locationId == this.currentLocationOrder[i]) output += loc.displayForEventDetail();
		}
	}
	if (this.getEventState() < Event.state.decided) output += '<li class="locationCell"><div class="locationInfo">Add Locations</div></li>';
	else {
		output += '<li class="locationCell showLocations"><div>Show other locations</div></li>';
		output += '<li class="locationCell hideLocations"><div>Hide other locations</div></li>';
	}
	output += '</ul>';
	return output;
}

Event.prototype.getLocationById = function(id) {
	if (id) {
		for (var i=0; i<this.allLocations.length; i++) {
			var loc = this.allLocations[i];
			if (loc.locationId == id) return loc;
		}
	}
	return null;
}

Event.prototype.getOfficialLocationByTempId = function(id) {
	for (var i=0; i<this.allLocations.length; i++) {
		var loc = this.allLocations[i];
		if (loc.tempId == id && loc.locationId) return loc;
	}
	return null;
}

Event.prototype.participantList = function() {
	var output = '<ul class="participantList">';
	for (var i=0; i<this.allParticipants.length; i++) {
		var p = this.allParticipants[i];
		output += p.displayForEventDetail();
	}
	output += '</ul>';
	return output;
}

Event.prototype.getParticipantById = function(id) {
	for (var i=0; i<this.allParticipants.length; i++) {
		var p = this.allParticipants[i];
		if (p.email == id) return p;
	}
	return null;
}

Event.prototype.iVotedFor = function(id) {
	if (id != "") {
		for (var i=0; i<this.locationsVotedFor.length; i++) {
			if (this.locationsVotedFor[i] == id) return true;
		}
	}
	return false;
}

Event.prototype.getFormattedDate = function() {
	var adjustedDate = new Date(this.eventDate - (this.eventDate.getTimezoneOffset() * 60 * 1000));
	var todayMidnight = new Date();
	todayMidnight.setHours(0);
	todayMidnight.setMinutes(0);
	todayMidnight.setSeconds(0);
	todayMidnight.setMilliseconds(0);
	var dayDiff = (adjustedDate - todayMidnight) / (1000*60*60*24);
	var output = "";
	var monthArray = new Array("January","February","March","April","May","June","July","August","September","October","November","December");
	var dayArray = new Array("Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday");
	var month = adjustedDate.getMonth();
	var date = adjustedDate.getDate();
	var day = adjustedDate.getDay();
	var hour = adjustedDate.getHours();
	var amPm = "AM";
	if (hour >= 12) {
		hour -= 12;
		amPm = "PM";
	}
	if (hour == 0) hour = 12;
	var minutes = adjustedDate.getMinutes();
	if (minutes < 10) {
		minutes = "0"+minutes;
	}
	if (dayDiff >= -1 && dayDiff < 8) {
        if (dayDiff < 0) {
            output = "Yesterday "+ hour +":"+ minutes +" "+ amPm;
        } else if (dayDiff < 1) {
            output = "Today "+ hour +":"+ minutes +" "+ amPm;
        } else if (dayDiff < 2) {
            output = "Tomorrow "+ hour +":"+ minutes +" "+ amPm;
        } else if (dayDiff < 8) {
            output = dayArray[day] +" "+ hour +":"+ minutes +" "+ amPm;
        }
    } else {
        output = monthArray[month] +" "+ date +" "+ hour +":"+ minutes +" "+ amPm;
    }
    return output;
}

Event.state = {newEvent:0, voting:1, votingWarning:2, decided:3, started:4, ended:5, cancelled:6};

Event.prototype.getEventState = function() {
	var state = 0;
    
    if (this.minutesToGoUntilVotingEnds() > 90) state = Event.state.voting;
    if (this.minutesToGoUntilVotingEnds() <= 90) state = Event.state.votingWarning;
    if (this.minutesToGoUntilVotingEnds() <= 0) state = Event.state.decided;
    if (this.minutesToGoUntilEventStarts() <= 0) state = Event.state.started;
    if (this.minutesToGoUntilEventStarts() < -120) state = Event.state.ended;
//    if (self.isTemporary) state = EventStateNew;
    if (this.hasBeenCancelled) state = Event.state.cancelled;

    return state;
}

Event.prototype.minutesToGoUntilVotingEnds = function() {
	var now = new Date();
	now.setSeconds(0);
	now.setMilliseconds(0);
	var adjustedExpireDate = new Date(this.eventExpireDate - (this.eventExpireDate.getTimezoneOffset() * 60 * 1000));
	return Math.floor((adjustedExpireDate - now) / (1000 * 60));
}

Event.prototype.minutesToGoUntilEventStarts = function() {
	var now = new Date();
	now.setSeconds(0);
	now.setMilliseconds(0);
	var adjustedEventDate = new Date(this.eventDate - (this.eventDate.getTimezoneOffset() * 60 * 1000));
	return Math.floor((adjustedEventDate - now) / (1000 * 60));
}