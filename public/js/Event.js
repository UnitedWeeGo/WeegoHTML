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
	
	this.isTemporary = false;
}

Event.prototype.populateWithXML = function(xml) {
	if ($(xml).attr('id').length) this.eventId = $(xml).attr('id');
	if ($(xml).find('eventTitle').text().length) this.eventTitle = $(xml).find('eventTitle').text();
	var eventDateStr = $(xml).find('eventInfo').attr('eventDate');
	if ($(xml).find('eventInfo').attr('eventDate')) this.eventDate = this.getDateFromString($(xml).find('eventInfo').attr('eventDate'));
	if ($(xml).find('eventInfo').attr('eventExpireDate')) this.eventExpireDate = this.getDateFromString($(xml).find('eventInfo').attr('eventExpireDate'));
	if ($(xml).find('creatorId').text().length) this.creatorId = $(xml).find('creatorId').text();
	if ($(xml).find('acceptedParticipantList')) this.acceptedParticipantList = $(xml).find('acceptedParticipantList').text();
	if ($(xml).find('declinedParticipantList')) this.declinedParticipantList = $(xml).find('declinedParticipantList').text();
	if ($(xml).find('eventInfo').attr('topLocationId')) this.topLocationId = $(xml).find('eventInfo').attr('topLocationId');
	if ($(xml).find('eventInfo').attr('count')) this.participantCount = $(xml).find('eventInfo').attr('count');
	if ($(xml).find('feedMessages').attr('unreadMessageCount').length) this.unreadMessageCount = $(xml).find('feedMessages').attr('unreadMessageCount');
	if ($(xml).find('eventInfo').attr('hasBeenRead')) this.eventRead = ($(xml).find('eventInfo').attr('hasBeenRead') == "true");
	if ($(xml).find('eventInfo').attr('hasCheckedIn')) this.hasBeenCheckedIn = ($(xml).find('eventInfo').attr('hasCheckedIn') == "true");
	if ($(xml).find('locationOrder').attr('order')) this.currentLocationOrder = $(xml).find('locationOrder').attr('order').split(",");
	if ($(xml).find('iVotedFor').attr('locations') || $(xml).find('iVotedFor').attr('locations') == "") this.locationsVotedFor = $(xml).find('iVotedFor').attr('locations').split(",");
	
	if (!this.topLocationId) {
		this.topLocationId = this.currentLocationOrder[0];
	}
	
	var callback = this;
	$(xml).find('location').each(function() {
		var id = $(this).attr("id");
		var loc = callback.getLocationById(id);
		if (!loc) {
			loc = new Location();
			callback.allLocations.push(loc);
		}
		loc.populateWithXML(this);
	});
	
	$(xml).find('participant').each(function() {
		var id = $(this).attr("email");
		var p = callback.getParticipantById(id);
		if (!p) {
			p = new Participant();
			callback.allParticipants.push(p);
		}
		p.populateWithXML(this);
	});
	
	this.creatorParticipant = this.getParticipantById(this.creatorId);
}

Event.prototype.getDateFromString = function(dateStr) {
	var testDate = new Date(2000,12,1);
	var monthCorrection = 0;
	if (testDate.getFullYear() != 2000) {
		monthCorrection = 1;
	}
	var a=dateStr.split(" ");
	d=a[0].split("-");
	t=a[1].split(":");
	return new Date(d[0],parseInt(d[1],10)-monthCorrection,d[2],t[0],t[1],t[2]);
}

Event.prototype.displayForDashboardFull = function() {
	var winningLocation = this.getLocationById(this.topLocationId);
	var locHtml = (winningLocation) ? winningLocation.displayForLocationDetail() : '<p class="noLocation callToAction"><i>No locations added</i></p>'
	var output = 	'<li class="dashboardEvent" eventId="'+ this.eventId +'">';
 	output +=			this.getEventInfoView();
	output +=			'<div class="winningLocation">'+ locHtml +'</div>';
	output +=		'</li>';
	return output;
}

Event.prototype.displayForDashboard = function() {
	var winningLocation = this.getLocationById(this.topLocationId);
	var output = 	'<li class="dashboardEvent" eventId="'+ this.eventId +'">';
 	output +=			this.getEventInfoView();
	output +=		'</li>';
	return output;
}

Event.prototype.displayForEventDetail = function() {
	var output =	this.getEventInfoView();
		output +=	this.locationList();
		output +=	this.participantList();
	return output;
}

Event.prototype.getEventInfoView = function() {
	var output =	'<div class="eventInfo">';
		output +=		'<img class="userAvatar" src="'+ this.creatorParticipant.avatarURL +'" />';
		output +=		'<div class="textContent">';
		output +=			'<p>'+ this.creatorParticipant.getFullName() +'</p>';
		output +=			'<h2>'+ this.eventTitle +'</h2>';
		output +=			'<p>'+ this.getFormattedDate() +'</p>';
		if (this.getEventState() < Event.state.decided && this.getEventState() > Event.state.newEvent) {
			if (this.getEventState() == Event.state.votingWarning) {
				output +=	'<p>Voting ends in '+ this.minutesToGoUntilVotingEnds() +' minutes</p>';
			} else {
				output +=	'<p>Voting is open</p>';
			}
		}
		output += 		'</div>';
		output += 	'</div>';
	return output;
}

Event.prototype.locationList = function() {
	var output = '<ul class="collapseableList locationList">';
	for (var i=0; i<this.currentLocationOrder.length; i++) {
		for (var j=0; j<this.allLocations.length; j++) {
			var loc = this.allLocations[j];
			if (loc.locationId == this.currentLocationOrder[i]) output += loc.displayForEventDetail();
		}
	}
	if (this.getEventState() < Event.state.decided) output += '<li class="locationCell callToAction"><div class="locationInfo">Add Location(s)</div></li>';
	else {
		if (this.allLocations.length > 0) {
			output += '<li class="locationCell decidedMapCell"><div id="map_canvas_details" style="width: 100%; height: 100%;"></div></li>';
		} else {
			output += '<li class="locationCell callToAction">No locations added</li>';
		}
//		output += '<li class="locationCell callToAction showLocations">Show other locations</li>';
//		output += '<li class="locationCell callToAction hideLocations">Hide other locations</li>';
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
		if (loc.tempId == id && loc.locationId) {
			return loc;
		}
	}
	return null;
}

Event.prototype.participantList = function() {
	var output = '<ul class="collapseableList participantList">';
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

Event.prototype.getWinningLocation = function() {
	return this.getLocationById(this.topLocationId);
}

Event.prototype.didVoteForWinningLocation = function() {
	var winningLocation = this.getLocationById(this.topLocationId);
	return (winningLocation) ? winningLocation.iVotedFor : false;
}

Event.prototype.getWinningLocationStaticMapUrl = function() {
	var winningLocation = this.getLocationById(this.topLocationId);
	return (winningLocation) ? winningLocation.getStaticMapUrl() : null;
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
	
	if (this.isTemporary) return Event.state.newEvent;
    
    if (this.minutesToGoUntilVotingEnds() > 90) state = Event.state.voting;
    if (this.minutesToGoUntilVotingEnds() <= 90) state = Event.state.votingWarning;
    if (this.minutesToGoUntilVotingEnds() <= 0) state = Event.state.decided;
    if (this.minutesToGoUntilEventStarts() <= 0) state = Event.state.started;
    if (this.minutesToGoUntilEventStarts() < -120) state = Event.state.ended;
//    
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

Event.prototype.didAcceptEvent = function() {
	var arr = this.acceptedParticipantList.split(",");
	for (var i=0; i<arr.length; i++) {
		if (Model.getInstance().loginParticipant.email == arr[i]) {
			return true;
		}
	}
	return false;
}

Event.prototype.didDeclineEvent = function() {
	var arr = this.declinedParticipantList.split(",");
	for (var i=0; i<arr.length; i++) {
		if (Model.getInstance().loginParticipant.email == arr[i]) {
			return true;
		}
	}
	return false;
}

Event.prototype.didViewEvent = function() {
	return this.eventRead;
}

Event.prototype.showCountMeIn = function() {
	return (!this.didAcceptEvent() || this.didDeclineEvent());
}

Event.prototype.getJSON = function() {
//	top location (lat lng)
//	event id
//	ruid
//	event start time
//	event decided time
// 	hasBeenCheckedIn
	var loc = this.getWinningLocation();
	var output = 	'{"type":"Event", "eventId":"'+ this.eventId +'", "eventDate":"'+ this.eventDate +'", "eventExpireDate":"'+ this.eventExpireDate +'", "hasBeenCheckedIn":"'+ this.hasBeenCheckedIn +'"';
	if (loc) {
		output +=		', "locations":['+
							'{"type":"Location", "latitude":"'+ loc.latitude +'", "longitude":"'+ loc.longitude +'"}'+
						']';
	}
	output +=		'}';
	return output;
}






