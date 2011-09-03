function Dashboard() {
	this.type = "Dashboard";
	this.allEvents = null;
	this.daysEvents = new Array();
	this.futureEvents = new Array();
	this.pastEvents = new Array();
}

Dashboard.prototype.init = function() {
	this.getDashboardEvents();
}

Dashboard.prototype.getDashboardEvents = function() {
	var url = domain + "/get.event.dashboard.php";
	var callback = this;
	$.get(url, {registeredId:ruid}, function(data) {
		callback.handleGetDashboardEvents(data);
	});
}

Dashboard.prototype.handleGetDashboardEvents = function(data) {
	var allEventsXML = $(data).find('event');
	this.allEvents = new Array();
	for (var i=0; i<allEventsXML.length; i++) {
		var evXML = allEventsXML[i];
		var ev = new Event();
		ev.populateWithXML(evXML);
		this.allEvents.push(ev);
	}
	this.sortEvents();
	this.setUpUI();
}

Dashboard.prototype.setUpUI = function() {
	var dashboard = $('#dashboard');
	dashboard.find('.content').html('');
	if (this.daysEvents.length > 0) {
		dashboard.find('.content').append('<ul class="daysEventsList">');
		for (var i=0; i<this.daysEvents.length; i++) {
			var ev = this.daysEvents[i];
			dashboard.find('.daysEventsList').append(ev.displayForDashboardFull());
		}
	}
	if (this.futureEvents.length > 0) {
		dashboard.find('.content').append('<ul class="collapseableList futureEventsList">');
		dashboard.find('.futureEventsList').append('<li class="callToAction">Future Events</li>');
		for (var i=0; i<this.futureEvents.length; i++) {
			var ev = this.futureEvents[i];
			dashboard.find('.futureEventsList').append(ev.displayForDashboard());
		}
	}
	if (this.pastEvents.length > 0) {
		dashboard.find('.content').append('<ul class="collapseableList pastEventsList">');
		dashboard.find('.pastEventsList').append('<li class="callToAction">Past Events</li>');
		for (var i=0; i<this.pastEvents.length; i++) {
			var ev = this.pastEvents[i];
			dashboard.find('.pastEventsList').append(ev.displayForDashboard());
		}
	}
	var callback = this;
	dashboard.find('LI').each(function() {
		$(this).unbind('click');
		$(this).click(function() {
			callback.handleEventCellClick($(this).attr("eventId"));
		});
	});
	$('.daysEventsList').find('LI').each(function() {
		var id = $(this).attr("eventId");
		var ev = callback.getEventById(id);
		$(this).find(".voteButton").removeClass("iVotedFor");
		if (ev.didVoteForWinningLocation()) $(this).find(".voteButton").addClass("iVotedFor");
	});
	ViewController.getInstance().resetScroll();
}

Dashboard.prototype.handleEventCellClick = function(eventId) {
	ViewController.getInstance().showEventDetail(eventId);
}

Dashboard.prototype.sortEvents = function() {
	this.daysEvents = new Array();
	this.futureEvents = new Array();
	this.pastEvents = new Array();
	var sortedEvents = this.allEvents.sort(this.compareDates);
	var todayMidnight = new Date();
	todayMidnight.setHours(0);
	todayMidnight.setMinutes(0);
	todayMidnight.setSeconds(0);
	todayMidnight.setMilliseconds(0);
	
	for (var i=0; i<sortedEvents.length; i++) {
		var ev = sortedEvents[i];
		var adjustedDate = new Date(ev.eventDate - (ev.eventDate.getTimezoneOffset() * 60 * 1000));
		var dayDiff = (adjustedDate - todayMidnight) / (1000*60*60*24);
		if (dayDiff >= 0 && dayDiff <= 1) {
			var now = new Date();
			if (adjustedDate - now < -1000*60*60*3) {
                this.pastEvents.push(ev);
            } else this.daysEvents.push(ev);
		} else if (dayDiff > 1) {
			this.futureEvents.push(ev);
		} else {
			this.pastEvents.push(ev);
		}
	}
	this.pastEvents.reverse();
	if (this.daysEvents.length == 0 && this.futureEvents.length > 0) {
		this.daysEvents.push(this.futureEvents.shift());
	}
}

Dashboard.prototype.compareDates = function(a,b) {
	var dateA = a.eventDate;
	var dateB = b.eventDate;
	return dateA - dateB;
}

Dashboard.prototype.getEventById = function(id) {
	for (var i=0; i<this.allEvents.length; i++) {
		var ev = this.allEvents[i];
		if (ev.eventId == id) return ev;
	}
	return null;
}