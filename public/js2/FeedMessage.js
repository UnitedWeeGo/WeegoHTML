function FeedMessage() {
	this.ownerEventId = '';
	this.type = '';
	this.senderId = '';
	this.messageRead = '';
	this.messageSentTimestamp = '';
	this.message = '';
	this.imageURL = '';
	this.messageId = '';
	this.friendlyTimestamp = '';
	this.userReadMessage = false;
}

FeedMessage.prototype.populateWithXML = function(xml) {
	this.messageId = $(xml).attr("id");
    this.type = $(xml).attr("type");
    this.senderId = $(xml).attr("senderId");
    this.userReadMessage = ($(xml).attr("messageRead") == "true");
    this.messageSentTimestamp = $(xml).attr("timestamp");
    this.message = $(xml).find("message").text();
}

FeedMessage.prototype.getDateFromString = function(dateStr) {
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

FeedMessage.prototype.getFriendlyTimestamp = function() {
	var now = new Date();
	now.setMilliseconds(0);
	now.setSeconds(0);
	var adjustedDate = new Date(now.getTime() + (now.getTimezoneOffset() * 60 * 1000));
	var sent = this.getDateFromString(this.messageSentTimestamp);
	sent.setSeconds(0);
	var minutes = (adjustedDate.getTime() - sent.getTime()) / (1000 * 60);
	if (minutes < 2) return "Just Now";
	var hours = Math.floor(minutes/60);
	var days = 0;
	if (hours > 0) days = Math.floor(hours/24);
	var output = '';
	if (days > 0) {
		output = days +" day";
		if (days > 1) output += "s";
	} else if (hours > 0) {
		output = hours +" hour";
		if (hours > 1) output += "s";
	} else {
		output = minutes +" minute";
		if (minutes > 1) output += "s";
	}
	return output;
}