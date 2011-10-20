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