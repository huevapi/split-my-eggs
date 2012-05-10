// login manager
Login = new (Backbone.View.extend({
	el: ".login",

	events: {
		"submit": "submit"
	},

	submit: function(e) {
		var data = Serialize(this.el);

		Core.session.login(data.username, data.password);

		return false;
	}
}));

// session manager
Core.session.on("change:status", function(model, status) {
	if(status === "connected") {
		document.location.hash = "#/";
		document.location.pathname = "/apps/mall/" + Core.session.user.roll.id;
	}
});


// recover password
$("a.recover-password").click(function() {
	var username = $("[data-obj='username']").val();

	if(username === "")
		alert("Debes llenar el campo 'Usuario'");
	else {
		$.post("/api/sessions/forgot", { user: username });
		alert("Al mail asociado al usuario " + username + " se le enviará la contraseña");
	}
});