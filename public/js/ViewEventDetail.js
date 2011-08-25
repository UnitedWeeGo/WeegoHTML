function EventDetail() {
	this.type = "EventDetail";
	this.eventId = '';
	this.event = null;
	this.lastUpdatedTimestamp = null;
}

EventDetail.prototype.init = function(eventId) {
	this.eventId = eventId;
	this.getSingleEvent();
	this.setEvents();
}

EventDetail.prototype.setEvents = function() {
	var callback = this;
	$('#eventDetail').find('.backButton').unbind('click');
	$('#eventDetail').find('.backButton').click(function() {
		ViewController.getInstance().showDashboard();
	});
}

EventDetail.prototype.getSingleEvent = function() {
	var url = domain + "/get.event.php";
	var callback = this;
	var params = {registeredId:ruid, eventId:this.eventId};
	if (this.event && this.event.lastUpdatedTimestamp) params.timestamp = this.event.lastUpdatedTimestamp;
	$.get(url, params, function(data) {
		callback.handleGetSingleEvent(data);
	});
}

EventDetail.prototype.handleGetSingleEvent = function(data) {
	this.lastUpdatedTimestamp = $(data).find('response').attr('timestamp');
	var allEventsXML = $(data).find('event');
	for (var i=0; i<allEventsXML.length; i++) {
		var evXML = allEventsXML[i];
 		if (!this.event) this.event = new Event();
 		this.event.lastUpdatedTimestamp = $(data).find('response').attr('timestamp');
 		this.event.populateWithXML(evXML);
	}
	this.setUpUI();
}

EventDetail.prototype.setUpUI = function() {
	var eventDetail = $("#eventDetail");
	eventDetail.find('.content').html("");
	eventDetail.find('.content').append(this.event.displayForEventDetail());
	this.enableLocationButtons();
	this.enableVoteButtons();
}

EventDetail.prototype.enableLocationButtons = function() {
	var callback = this;
	$(".locationList").find(".locationCell").each(function() {
		var id = $(this).attr("id");
		$(this).find(".locationInfo").unbind('click');
		$(this).find(".locationInfo").click(function() {
			ViewController.getInstance().showAddLocations(callback.event, id);
		});
	});
}

EventDetail.prototype.enableVoteButtons = function() {
	var callback = this;
	$(".locationList").find(".locationCell").each(function() {
		var id = $(this).attr("id");
		$(this).find(".voteButton").removeClass("iVotedFor");
		if (id && callback.event.iVotedFor(id)) $(this).find(".voteButton").addClass("iVotedFor");
		$(this).find(".voteButton").unbind('click');
		$(this).find(".voteButton").click(function() {
			callback.toggleVoteForLocationWithId(id);
		});
	});
}

EventDetail.prototype.toggleVoteForLocationWithId = function(locationId) {
	var xmlStr = '<event id="'+ this.event.eventId +'"><votes><vote locationId="'+ locationId +'" /></votes></event>';
	var url = domain + "/xml.vote.php";
	var callback = this;
	var params = {registeredId:ruid, xml:xmlStr};
	if (this.event.lastUpdatedTimestamp) params.timestamp = this.event.lastUpdatedTimestamp;
	$.post(url, params, function(data) {
		callback.handleGetSingleEvent(data);
	});
}