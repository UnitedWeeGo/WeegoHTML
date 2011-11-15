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
	this.hasBeenCancelled = false;
	this.hasBeenCheckedIn = false;
	
	this.allLocations = [];
	this.allParticipants = [];
	this.allMessages = [];
	
	this.currentLocationOrder = [];
	this.locationsVotedFor = [];
	
	this.creatorParticipant = null;
	
	this.lastUpdatedTimestamp = null;
	
	this.isTemporary = false;
	this.forcedDecided = false;
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
	if ($(xml).find('eventInfo').attr('hasBeenCancelled')) this.hasBeenCancelled = ($(xml).find('eventInfo').attr('hasBeenCancelled') == "true");
	if ($(xml).find('eventInfo').attr('hasCheckedIn')) this.hasBeenCheckedIn = ($(xml).find('eventInfo').attr('hasCheckedIn') == "true");
	if ($(xml).find('locationOrder').attr('order')) this.currentLocationOrder = $(xml).find('locationOrder').attr('order').split(",");
	if ($(xml).find('iVotedFor').attr('locations') || $(xml).find('iVotedFor').attr('locations') == "") this.locationsVotedFor = $(xml).find('iVotedFor').attr('locations').split(",");
	if ($(xml).find('forcedDecided').text().length) this.forcedDecided = ($(xml).find('forcedDecided').text() == "true");
	
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
	
	$(xml).find('feedMessage').each(function() {
		var id = $(this).attr("id");
		var m = callback.getMessageById(id);
		if (!m) {
			m = new FeedMessage();
			callback.allMessages.push(m);
		}
		m.populateWithXML(this);
	});
	
	this.creatorParticipant = this.getParticipantById(this.creatorId);
}

Event.prototype.getCreatorNamePossessive = function() {
	var name = this.creatorParticipant.firstName;
	var lastChar = name.substr(name.length-1,name.length);
	return (lastChar == 's') ? name +"'" : name +"'s";
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
	var status = this.getStatusHTML();
	var messageIndicator = this.getMessageIndicatorHTML();
	var winningLocation = this.getLocationById(this.topLocationId);
	var locHtml = (winningLocation) ? winningLocation.displayForLocationDetail() : '<p class="noLocation callToAction"><i>No locations added</i></p>'
	var output = 	'<li class="dashboardEvent" eventId="'+ this.eventId +'">';
	if (status || messageIndicator) {
		output += '<div class="statusBlock">';
 		if (status) output += status;
 		if (messageIndicator) output+= messageIndicator;
 		output += '</div>';
 	}
 	output +=			this.getEventInfoView(true);
	output +=			'<div class="winningLocation">'+ locHtml +'</div>';
	output +=		'</li>';
	return output;
}

Event.prototype.displayForDashboard = function() {
	var status = this.getStatusHTML();
	var messageIndicator = this.getMessageIndicatorHTML();
	var winningLocation = this.getLocationById(this.topLocationId);
	var output = 	'<li class="dashboardEvent" eventId="'+ this.eventId +'">';
	if (status || messageIndicator) {
		output += '<div class="statusBlock">';
 		if (status) output += status;
 		if (messageIndicator) output+= messageIndicator;
 		output += '</div>';
 	}
 	output +=			this.getEventInfoView();
	output +=		'</li>';
	return output;
}

Event.prototype.getStatusHTML = function() {
	var status = null;
	if (!this.didAcceptEvent() && !this.didDeclineEvent()) status = '<div class="status">PENDING</div>';
	if (!this.eventRead) status = '<div class="status">NEW</div>';
	if (this.didDeclineEvent()) status = '<div class="status red">DECLINED</div>';
	if (this.hasBeenCancelled) status ='<div class="status red">CANCELLED</div>';
	return status;
}

Event.prototype.getMessageIndicatorHTML = function() {
	var html = null;
	if (parseInt(this.unreadMessageCount) > 0) {
		html = '<div class="messageIndicator">'+ this.unreadMessageCount +'</div>';
	}
	return html;
}

Event.prototype.displayForEventDetail = function() {
	var output =	this.getEventInfoView(true, true);
		output +=	this.locationList();
		output +=	this.participantList();
	return output;
}

Event.prototype.getEventInfoView = function(displayFull, eventDetailsView) {
	var status = null;
	if (this.hasBeenCancelled && eventDetailsView) status = '<div class="status red">CANCELLED</div>';
	var output =	'<div class="eventInfo">';
		if (status) output += status;
		output +=		'<img class="userAvatar" src="'+ this.creatorParticipant.avatarURL +'" />';
		output +=		'<div class="textContent">';
		output +=			'<p>'+ this.creatorParticipant.getFullName() +'</p>';
		output +=			'<h2>'+ this.eventTitle +'</h2>';
		output +=			'<p>'+ this.getFormattedDate() +'</p>';
		if (displayFull && this.getEventState() < Event.state.decided && this.getEventState() > Event.state.newEvent) {
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
	if (this.getEventState() < Event.state.decided) {
		output += '<li class="locationCell callToAction"><div class="locationInfo">Add location(s)</div></li>';
	}
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
	output += this.participantListItems();
	if (this.getEventState() < Event.state.ended) {
		output += '<li class="participantCell callToAction">Add friend(s)</li>';
	}
	output += '</ul>';
	return output;
}

Event.prototype.participantListItems = function() {
	var output = '';
	for (var i=0; i<this.allParticipants.length; i++) {
		var p = this.allParticipants[i];
		var status = null;
		if (this.didDeclineEvent(p.email)) status = "COUNT ME OUT";
		if (!this.didAcceptEvent(p.email) && !this.didDeclineEvent(p.email)) status = "PENDING";
		output += p.displayForEventDetail(status);
	}
	return output;
}

Event.prototype.getParticipantById = function(id) {
	for (var i=0; i<this.allParticipants.length; i++) {
		var p = this.allParticipants[i];
		if (p.email == id) return p;
	}
	return null;
}

Event.prototype.getMessageById = function(id) {
	for (var i=0; i<this.allMessages.length; i++) {
		var m = this.allMessages[i];
		if (m.messageId == id) return m;
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
    if (this.forcedDecided)
    {
        state = Event.state.decided;
    } else {
    	if (this.minutesToGoUntilVotingEnds() > 90) state = Event.state.voting;
    	if (this.minutesToGoUntilVotingEnds() <= 90) state = Event.state.votingWarning;
    	if (this.minutesToGoUntilVotingEnds() <= 0) state = Event.state.decided;
    }
    if (this.minutesToGoUntilEventStarts() <= 0) state = Event.state.started;
    if (this.minutesToGoUntilEventStarts() < -120) state = Event.state.ended;
    
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

Event.prototype.didAcceptEvent = function(id) {
	var arr = this.acceptedParticipantList.split(",");
	var e = (id) ? id : Model.getInstance().loginParticipant.email;
	for (var i=0; i<arr.length; i++) {
		if (e == arr[i]) {
			return true;
		}
	}
	return false;
}

Event.prototype.didDeclineEvent = function(id) {
	var arr = this.declinedParticipantList.split(",");
	var e = (id) ? id : Model.getInstance().loginParticipant.email;
	for (var i=0; i<arr.length; i++) {
		if (e == arr[i]) {
			return true;
		}
	}
	return false;
}

Event.prototype.setDefaultTime = function() {
	var now = new Date();
	now.setMilliseconds(0);
	now.setSeconds(0);
	var midnight = new Date();
	midnight.setMilliseconds(0);
	midnight.setSeconds(0);
	midnight.setMinutes(0);
	midnight.setHours(0);
	var earlyCutoff = new Date();
	earlyCutoff.setMilliseconds(0);
	earlyCutoff.setSeconds(0);
	earlyCutoff.setMinutes(0);
	earlyCutoff.setHours(9);
	var earlyDefault = new Date();
	earlyDefault.setMilliseconds(0);
	earlyDefault.setSeconds(0);
	earlyDefault.setMinutes(30);
	earlyDefault.setHours(12);
	var lateCutoff = new Date();
	lateCutoff.setMilliseconds(0);
	lateCutoff.setSeconds(0);
	lateCutoff.setMinutes(0);
	lateCutoff.setHours(14);
	var lateDefault = new Date();
	lateDefault.setMilliseconds(0);
	lateDefault.setSeconds(0);
	lateDefault.setMinutes(0);
	lateDefault.setHours(18);
	
	var hourAhead = new Date();
	hourAhead.setMilliseconds(0);
	hourAhead.setSeconds(0);
	hourAhead.setMinutes(Math.ceil(now.getMinutes() / 5)*5);
	hourAhead.setHours(now.getHours()+1);
	
	var defaultTime;
	if (now > earlyCutoff && hourAhead < earlyDefault) {
		defaultTime = earlyDefault;
	} else if (now > lateCutoff && now < lateDefault) {
		defaultTime = lateDefault;
	} else {
		defaultTime = hourAhead;
	}
	this.eventDate = defaultTime;
}

Event.prototype.didViewEvent = function() {
	return this.eventRead;
}

Event.prototype.showCountMeIn = function() {
	return (!this.didAcceptEvent() || this.didDeclineEvent());
}

Event.prototype.xmlForUpload = function() {
	var eventDateGMT = new Date(this.eventDate);
	eventDateGMT.setMinutes(eventDateGMT.getMinutes() + eventDateGMT.getTimezoneOffset());
	var isPlus = false;
	if (eventDateGMT.getTimezoneOffset() < 0) {
		isPlus = true;
	}
	var hoursOffset = parseInt(Math.floor(eventDateGMT.getTimezoneOffset() / 60));
	if (isPlus) hoursOffset *= -1;
	var minutesOffset = parseInt(eventDateGMT.getTimezoneOffset() % 60);
	if (isPlus) minutesOffset *= -1;
	var tzStr = '';
	if (hoursOffset < 10) tzStr += '0'+ hoursOffset.toString();
	else tzStr += hoursOffset.toString();
	if (minutesOffset < 10) tzStr += '0'+ minutesOffset.toString();
	else tzStr += minutesOffset.toString();
	if (isPlus) tzStr = '+'+ tzStr;
	else tzStr = '-'+ tzStr;
	var xmlStr = 	'<request>';
	xmlStr +=			'<event requestId="'+ this.eventId +'">';
	xmlStr +=				'<eventInfo eventDate="'+ eventDateGMT.format("yyyy-mm-dd HH:MM:ss") +'" eventTimeZone="'+ tzStr +'">';
	xmlStr +=					'<eventTitle>'+ this.eventTitle +'</eventTitle>';
	xmlStr +=					'<eventDescription></eventDescription>';
	xmlStr +=				'</eventInfo>';
	if (this.allLocations.length > 0) {
		xmlStr +=			'<locations>';
		for (var i=0; i<this.currentLocationOrder.length; i++) {
			for (var j=0; j<this.allLocations.length; j++) {
				var loc = this.allLocations[j];
				if (loc.locationId == this.currentLocationOrder[i]) xmlStr += loc.xmlForUpload();
			}
		}
		xmlStr +=			'</locations>';
	}
	if (this.allParticipants.length > 1) {
		xmlStr +=			'<participants>';
		for (var i=0; i<this.allParticipants.length; i++) {
			var p = this.allParticipants[i];
			if (p.email != this.creatorParticipant.email) {
				xmlStr += 		'<participant email="'+ p.email +'" />';
			}
		}
		xmlStr +=			'</participants>';
	}
	if (this.locationsVotedFor.length > 0) {
		xmlStr +=			'<votes>';
		for (var i=0; i<this.currentLocationOrder.length; i++) {
			if (this.iVotedFor(this.currentLocationOrder[i])) xmlStr += '<vote selectedLocationIndex="'+ i +'"/>';
		}
		xmlStr +=			'</votes>';
	}
	
	xmlStr +=			'</event>';
	xmlStr +=		'</request>';
	return xmlStr;
}

Event.prototype.getJSON = function() {
//	top location (lat lng)
//	event id
//	ruid
//	event start time
//	event decided time
// 	hasBeenCheckedIn
	var loc = this.getWinningLocation();
	var output = 	'{"type":"Event", "eventId":"'+ this.eventId +'", "eventDate":"'+ this.eventDate.format("ddd, dd mmm yyyy HH:MM:ss o") +'", "eventExpireDate":"'+ this.eventExpireDate.format("ddd, dd mmm yyyy HH:MM:ss o") +'", "hasBeenCheckedIn":"'+ this.hasBeenCheckedIn +'"';
	if (loc) {
		output +=		', "locations":['+
							'{"type":"Location", "latitude":"'+ loc.latitude +'", "longitude":"'+ loc.longitude +'"}'+
						']';
	}
	output +=		'}';
	return output;
}






