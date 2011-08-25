// Model

function Model() {
	this.allEvents = [];
}

Model.instance = null;

Model.getInstance = function() {
	if (Model.instance == null) Model.instance = new Model();
	return Model.instance;
}