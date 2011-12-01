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
    this.iVotedFor = false;
    this.ratingImgUrl = null;
    this.numRatings = null;
    this.mobileYelpUrl = null;
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
//    uFormatted_address = uFormatted_address.replace(/,/, "<br />");
    this.formatted_address = uFormatted_address; //this.formatAddress(uFormatted_address);
    this.formatted_phone_number = $(xml).find("formatted_phone_number").text();
    this.rating = $(xml).find("rating").text();
    this.locationType = $(xml).find("location_type").text();
    
    this.rating = $(xml).find("rating").text();
    this.numRatings = $(xml).find("review_count").text();
    this.mobileYelpUrl = $(xml).find("mobile_yelp_url").text();
    
    if (this.rating && this.rating.length > 0) this.ratingImgUrl = "/assets/images/stars_"+ this.rating +".png";
    
    this.hasBeenRemoved = $(xml).attr("hasBeenRemoved");
    this.iVotedFor = ($(xml).attr("iVotedFor") == "true");
}

Location.prototype.formatAddress = function(address) {
	address = address.replace(/, United States/gi, "");
    address = address.replace(/, USA/gi, "");
    address = address.replace(/,/, "<br />");
    return address;
}

Location.prototype.populateWithSGFeature = function(obj) {
	this.name = obj.properties.name;
    var street = obj.properties.address;
    var city = obj.properties.city;
    var state = obj.properties.province;
    var zip = obj.properties.postcode;
    var uFormatted_address = street +", "+ city +", "+ state +" "+ zip;
    this.formatted_address = uFormatted_address;
    var pn = obj.properties.phone;
	if (pn.indexOf('+1-') > -1) pn.replace('+1-','');
    this.formatted_phone_number = pn;
    this.hasDeal = (obj.properties.hasDeal == "true");
    this.locationType = "place";
    this.latitude = obj.geometry.coordinates[1];
    this.longitude = obj.geometry.coordinates[0];
    this.g_id = obj.id;
    this.locationType = 'place';
}

Location.prototype.populateWithGoogleResult = function(obj) {
	this.name = "Name Me!";
    this.formatted_address = this.formatAddress(obj.formatted_address);
    console.log(obj);
    this.latitude = obj.geometry.location.lat();
    this.longitude = obj.geometry.location.lng();
    this.locationType = 'address';
//    this.g_id = obj.id;
}

Location.prototype.populateWithYelpResult = function(obj) {
	console.log("--- "+ obj);
	this.name = obj.name;
	if (obj.location.address.length > 0) {
		this.formatted_address = obj.location.address[0] +", "+ obj.location.city +", "+ obj.location.state_code +" "+ obj.location.postal_code;
	} else {
		this.formatted_address = obj.location.city +", "+ obj.location.state_code +" "+ obj.location.postal_code;
	}
	this.latitude = obj.location.coordinate.latitude;
	this.longitude = obj.location.coordinate.longitude;
	this.g_id = obj.id;
	this.rating = obj.rating;
	this.ratingImgUrl = "/assets/images/stars_"+ this.rating +".png"; //obj.rating_img_url_small;
	this.numRatings = obj.review_count;
	this.mobileYelpUrl = obj.mobile_url;
	this.locationType = 'yelp';
	var pn = obj.phone;
	if (pn.indexOf('+1-') > -1) pn.replace('+1-','');
	this.formatted_phone_number = pn;
}

Location.prototype.displayForEventDetail = function() {
	var displayAddress = '';
	if (this.locationType == 'yelp') {
		var firstCommaIndex = this.formatted_address.indexOf(',');
		displayAddress = this.formatted_address.substr(0,firstCommaIndex);
	} else {
		displayAddress = this.formatAddress(this.formatted_address);
	}
	var output =	'<li class="locationCell" id="'+ this.locationId +'">'+
						'<div class="voteButton"></div>'+
						'<div class="locationInfo">'+
							'<h3>'+ this.name +'</h3>'+
							'<p>'+ displayAddress +'</p>';
	if (this.ratingImgUrl) output += '<div class="rating"><img src="'+ this.ratingImgUrl +'" /><div class="ratingText">'+ this.numRatings +' ratings</div></div>';
	output +=			'</div>';
					'</li>';
	return output;
}

Location.prototype.displayForLocationDetail = function(showVotedFor) {
	var displayAddress = '';
	if (this.locationType == 'yelp') {
		var firstCommaIndex = this.formatted_address.indexOf(',');
		displayAddress = this.formatted_address.substr(0,firstCommaIndex);
	} else {
		displayAddress = this.formatAddress(this.formatted_address);
	}
	var votedForClass = (showVotedFor) ? " iVotedFor" : "";
	var output = 	'<div class="voteButton'+ votedForClass +'"></div>'+
					'<div class="locationInfo">'+
						'<h3>'+ this.name +'</h3>'+
						'<p>'+ displayAddress +'</p>';
	if (this.ratingImgUrl) output += '<div class="rating"><img src="'+ this.ratingImgUrl +'" /><div class="ratingText">'+ this.numRatings +' ratings<div</div></div>';					
	output +=		'</div>';
	return output;
}

Location.prototype.xmlForUpload = function(tempId) {
	var tempIdStr = (tempId) ? ' tempId="'+ tempId +'"' : '';
	var xmlStr =	'<location'+ tempIdStr +' latitude="'+ this.latitude +'" longitude="'+ this.longitude +'">'+
						'<name>'+ this.name +'</name>'+
						'<vicinity>'+ this.vicinity +'</vicinity>'+
						'<g_id>'+ this.g_id +'</g_id>'+
						'<g_reference></g_reference>'+
						'<location_type>'+ this.locationType +'</location_type>'+
						'<formatted_address>'+ this.formatted_address +'</formatted_address>'+
						'<formatted_phone_number>'+ this.formatted_phone_number +'</formatted_phone_number>';
	if (this.rating) xmlStr += 			'<rating>'+ this.rating +'</rating>';
	if (this.numRatings) xmlStr += 		'<review_count>'+ this.numRatings +'</review_count>';
	if (this.mobileYelpUrl) xmlStr += 	'<mobile_yelp_url>'+ this.mobileYelpUrl +'</mobile_yelp_url>';
	xmlStr +=		'</location>';
	return xmlStr;
}

Location.prototype.getStaticMapUrl = function() {
	return 'http://maps.googleapis.com/maps/api/staticmap?center='+ this.latitude +','+ this.longitude +'&zoom=15&size=48x48&sensor=false';
}