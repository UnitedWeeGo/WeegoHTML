function SearchCategory() {
	this.category = null;
	this.category_id = null;
	this.subcategory = null;
	this.type = null;
}

SearchCategory.prototype.populateWithObject = function(obj) {
	this.category = obj.category;
	this.category_id = obj.category_id;
	this.subcategory = obj.subcategory;
	this.type = obj.type;
}

SearchCategory.prototype.getKeyValue = function() {
	return (this.subcategory.length > 0) ? this.subcategory : this.category;
}