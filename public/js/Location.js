function Location() {
	this.locationId = null;
    this.addedById = '';
    this.latitude = '';
    this.longitude = '';
    this.name = '';
    this.vicinity = '';
    this.g_id = '';
    this.formatted_address = '';
    this.formatted_phone_number = '';
    this.rating = '';
    this.location_type = '';
    this.hasBeenRemoved = '';
    this.hasDeal = '';
    this.locationType = '';
    this.tempId = '';
}

Location.prototype.populateWithXML = function(xml) {
	this.locationId = $(xml).attr("id");
    this.addedById = $(xml).attr("addedById");
    this.latitude = $(xml).attr("latitude");
    this.longitude = $(xml).attr("longitude");
    this.tempId = $(xml).attr("tempId");
    this.hasDeal = ($(xml).attr("hasDeal") == "true");
    this.name = unescape($(xml).find("name").text());
    this.vicinity = $(xml).find("vicinity").text();
    this.g_id = $(xml).find("g_id").text();
    var uFormatted_address = $(xml).find("formatted_address").text();
    uFormatted_address = uFormatted_address.replace(/, United States/gi, "");
    uFormatted_address = uFormatted_address.replace(/, USA/gi, "");
    uFormatted_address = uFormatted_address.replace(/,/, "<br />");
    this.formatted_address = uFormatted_address;
    this.formatted_phone_number = $(xml).find("formatted_phone_number").text();
    this.rating = $(xml).find("rating").text();
    this.locationType = $(xml).find("location_type").text();
    
    this.hasBeenRemoved = $(xml).attr("hasBeenRemoved");
}

Location.prototype.populateWithSGFeature = function(obj) {
	this.name = obj.properties.name;
    var street = obj.properties.address;
    var city = obj.properties.city;
    var state = obj.properties.province;
    var zip = obj.properties.postcode;
    var uFormatted_address = street +", "+ city +", "+ state +" "+ zip;
    this.formatted_address = uFormatted_address;
    this.formatted_phone_number = obj.properties.phone;
    this.hasDeal = (obj.properties.hasDeal == "true");
    this.locationType = "place";
    this.latitude = obj.geometry.coordinates[1];
    this.longitude = obj.geometry.coordinates[0];
    this.g_id = obj.id;
}

Location.prototype.displayForEventDetail = function() {
	var output =	'<li class="locationCell" id="'+ this.locationId +'">'+
						'<div class="voteButton"></div>'+
						'<div class="locationInfo">'+
							'<h3>'+ this.name +'</h3>'+
							'<p>'+ this.formatted_address +'</p>'+
						'</div>'+
					'</li>';
	return output;
}

Location.prototype.displayForLocationDetail = function() {
	var output = 	'<h3>'+ this.name +'</h3>'+
					'<p>'+ this.formatted_address +'</p>';
	return output;
}