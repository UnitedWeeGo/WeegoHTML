function Participant() {
	this.email = '';
	this.firstName = '';
	this.lastName = '';
	this.avatarURL = '';
	this.hasBeenRemoved = '';
	this.type = '';
}

Participant.prototype.populateWithXML = function(xml) {
	this.email = $(xml).attr("email");
	this.firstName = $(xml).find("firstName").text();
	this.lastName = $(xml).find("lastName").text();
	this.avatarURL = $(xml).find("avatarURL").text();
	this.hasBeenRemoved = ($(xml).attr("hasBeenRemoved") == "true");
	this.type = $(xml).attr("type");
}

Participant.prototype.displayForEventDetail = function(status) {
	var output =	'<li class="participantCell">';
	if (status) output += '<div class="status">'+ status +'</div>';
	if (this.avatarURL.length > 0) output += '<img src="'+ this.avatarURL +'" />';
	output +=			'<h3>'+ this.getFullName() +'</h3>'+
					'</li>';
	return output;
}

Participant.prototype.displayForAddFriends = function(classString, email) {
	var cls = (classString && classString.length > 0) ? " "+ classString : "";
	var es = (email && email.length > 0) ? " email="+ email : "";
	var output =	'<li class="participantCell'+ cls +'"'+ es +'>';
	if (status) output += '<div class="status">'+ status +'</div>';
	if (this.avatarURL.length > 0) output += '<img src="'+ this.avatarURL +'" />';
	output += 			'<h3>'+ this.getFullName() +'</h3>'+
					'</li>';
	return output;
}

Participant.prototype.getFullName = function() {
	var output = this.firstName;
	if (this.lastName.length > 0) output += " "+ this.lastName;
	if (output.length == 0) output = this.email;
	return output;
}