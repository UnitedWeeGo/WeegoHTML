function Participant() {
	this.email = '';
	this.firstName = '';
	this.lastName = '';
	this.avatarURL = '';
	this.hasBeenRemoved = '';
}

Participant.prototype.populateWithXML = function(xml) {
	this.email = $(xml).attr("email");
	this.firstName = $(xml).find("firstName").text();
	this.lastName = $(xml).find("lastName").text();
	this.avatarURL = $(xml).find("avatarURL").text();
	this.hasBeenRemoved = ($(xml).attr("hasBeenRemoved") == "true");
}

Participant.prototype.displayForEventDetail = function() {
	var output =	'<li class="participantCell">'+ 
						'<img src="'+ this.avatarURL +'" />'+
						'<h3>'+ this.getFullName() +'</h3>'+
					'</li>';
	return output;
}

Participant.prototype.getFullName = function() {
	var output = this.firstName;
	if (this.lastName.length > 0) output += " "+ this.lastName;
	if (output.length == 0) output = this.email;
	return output;
}