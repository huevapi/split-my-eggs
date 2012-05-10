
// Busca todos los elements en parent que tengan atributo data-obj
Serialize = function(parent) {
	var result = {};

	$("[data-obj]", parent).each(function() {
		var label = $(this).data("obj");
		var value = $(this).val();

		result[label] = value;
	});

	return result;
}

//////////////////////////
/// Core

Core = {};


//////////////////////////
/// MODELS

Core.Models = {
	// USER
	User: Backbone.Model.extend({
		roll: undefined,

		initialize: function(params) {
			this.roll = _.first(params.roles);
		}
	}),

	// LOGIN SESSION
	Session: Backbone.Model.extend({
		defaults: {
			status: ""	// loading, connected, not_connected
		},

		user: undefined,

		urlRoot: "/api/sessions",

		initialize: function() {
			this.on("change:user", function() {
				this.user = new Core.Models.User(this.get("user"));
				this.set({status: "connected"});
			}, this);

			this.on("sync", function() {
				//console.log(this);
			}, this);

			this.on("error", function() {
				this.set({status: "not_connected"});		
			}, this);

			this.on("change:status", function() {
				/*if(this.get("status") === "connected"){
					$("[data-obj='username']").html(this.user.get("first_name") + ' ' + this.user.get("last_name"));
				}*/
			}, this);
		},

		login: function(user, password) {
			var self = this;

			self.set({status: "loading"});

			$.post(this.urlRoot, {user: user, passwd: password})
				.done(function(json) {
					self.set(json);
				})
				.fail(function(json) {
					self.set({status: "not_connected"});
					alert("error en el login");
				})
		}
	}),
	
	// SITE (Alto Las Condes)
	Site: Backbone.Model.extend({
		urlRoot: "/api/sites",

		// clerks of this site
		clerks: undefined,

		// jobs for the site
		jobs: undefined,

		sections: undefined,

		// lista de guardias
		agents: undefined,

		initialize: function() {
			// sections
			this.sections = new Core.Collections.Sections;
			this.sections.url = this.url() + "/sections";

			// clerks
			this.clerks = new Core.Collections.Clerks;
		    this.clerks.url = this.url() + "/own/clerks";

		    // jobs
		    this.jobs = new Core.Collections.Jobs();
		    this.jobs.url = this.url() + "/jobs"

		   	// guardias
		   	this.agents = new Core.Collections.Agents();
		   	this.agents.url = this.url() + "/agents";
		}
	}),

	// SECTION (Tienda de un mall)
	Section: Backbone.Model.extend({
		defaults: {
			local_type: "tienda"
		},

		urlRoot: "",	// defined on initialize

		// [Collection] clerks within the section 
		clerks: undefined,

		// [Collection] jobs asigned to this section
		jobs: undefined,

		initialize: function() {
			// define urlRoot
			this.urlRoot = "/api/sites/" + Core.session.user.roll.site_id + "/sections";

			// create nested collections
			this.clerks = new Core.Collections.Clerks;
			this.jobs = new Core.Collections.Jobs;

			if(!this.isNew())
				this.setNestedUrls();
			else
				this.on("change:id", this.setNestedUrls, this);
		},

		// set urls for nested collections (clerks, jobs, etc...)
		setNestedUrls: function() {
			this.clerks.url = this.urlRoot + "/" + this.id + '/clerks';
			this.jobs.url 	= this.urlRoot + "/" + this.id + '/jobs';
		}
	}),

	// CONTRACT
	Contract: Backbone.Model.extend({
		defaults: {
			excluded: false,
			blocked: false
		},

		initialize: function() {
			if(this.get("blocked"))	this.set({excluded: true});

			this.on("change:excluded", function(model, val) {
				if(!val)	this.set({blocked: false});
			}, this);

			this.on("change:blocked", function(model, val) {
				if(val)		this.set({excluded: true});
			});
		}
	}),

	// CLERK
	Clerk: Backbone.Model.extend({}),	

	// JOB STATE (estado de un job)
	JobState: Backbone.Model.extend({
		defaults: {
			status_str: "pending",
			exclude: [],
			comments: ""
		}
	}),

	// JOB (Trabajo o Solicitud)
	Job: Backbone.Model.extend({
		defaults: {
			status_str: "pending"
		},

		// contracts on this job
		contracts: undefined,

		// estados del trabajo
		jobStates: undefined,

		initialize: function(params) {
			this.contracts = new Core.Collections.Contracts;

			if(!this.isNew()) {
				this.jobStates = new Core.Collections.JobStates;
				this.jobStates.url = this.url() + "/states";
			}

			this.on("change:contracts", function() {
				this.contracts.reset(this.get("contracts"));
			}, this);

			if(params) {
				if(params.section)
					this.set({ section_name: params.section.name, local_id: params.section.local_id});
			
				this.set(this.parse({
					start: 	params.start,
					end: 	params.end
				}));
			}
		},

		parse: function(res) {
			var newDate = function(str) {
				var str = str.split("-");
				return new Date(str[0], parseInt(str[1]-1), str[2]);
			}

			if(_.isString(res.start))	res.start = newDate(res.start);
			if(_.isString(res.end))		res.end = newDate(res.end);

			return res;
		},

		toJSON: function() {
			var json = Backbone.Model.prototype.toJSON.call(this);
			json.contracts = this.contracts.toJSON();

			return json;
		},

		changeState: function(value, comments) {
			this.set({ status_str: value });

			this.jobStates.create({
				status_str: value,
				comments: comments || "",
				exclude: this.contracts.chain()
							.map(function(c) { 
								return c.get("excluded") ? c.id : false;
							})
							.compact()
							.value()
			})
		}
	}),	
	
	Agent: Backbone.Model.extend({}),

	// INGRESO
	Register: Backbone.Model.extend({})
}


// hack time in some Models
_.each([Core.Models.Clerk, Core.Models.Job], function(M) {
	if(!M.prototype.defaults)
		M.prototype.defaults = {};

	_.extend(M.prototype.defaults,  {
		day_start: 0,		// seconds bla bla
		day_start_str: "",	// hora humana
		day_end: 0,			// seconds bla bla
		day_end_str: ""		// hora humana
	});

	var init = M.prototype.initialize;

	var timeStrToSeconds = function() {
		var start = this.get("day_start_str").split(":");
		var end = this.get("day_end_str").split(":");

		var params = {
			day_start: start[0] * 3600 + start[1] * 60,
			day_end: end[0]   * 3600 + end[1]   * 60
		}
		
		if(params.day_start > params.day_end)
			params.day_end += 24 * 3600;

		this.set(params);
	}

	M.prototype.initialize = function(params) {
		var day_start = this.get("day_start");
		var day_end = this.get("day_end");

		if(this.isNew()) {
			timeStrToSeconds.call(this);
		}
		else {
			var end = day_end < 24 * 3600 ? day_end : day_end - 24 * 3600;

			var minutes_start = (day_start % 3600) / 60;
			var minutes_end = (end % 3600) / 60;

			this.set({
				day_start_str: Math.floor(day_start / 3600) + ":" + (minutes_start < 10 ? "0" + minutes_start : minutes_start),
				day_end_str: Math.floor(end / 3600) + ":" + (minutes_end < 10 ? "0" + minutes_end : minutes_end)
			});
		}
		
		this.on("change:day_start_str change:day_end_str", function() {
			timeStrToSeconds.call(this);
		}, this);		

		if(init)
			init.call(this, params);
	}
});


///////////////////////
/// COLLECTIONS

Core.Collections = {

	Sections: Backbone.Collection.extend({
		model: Core.Models.Section
	}),

	Clerks: Backbone.Collection.extend({
		model: Core.Models.Clerk
	}),

	Jobs: Backbone.Collection.extend({
		model: Core.Models.Job,

		filter: "pending",	// pending, accepted, rejected,

		sync: function(method, model, options) {
			if(method === "read") {
				if(this.date)
					options.url = model.url + "?filter=" + this.filter + "&since=" + this.date + "&to=" + this.date;
				else
					options.url = model.url + "?filter=" + this.filter;
			}

		    Backbone.sync(method, model, options);
		}
	}),

	JobStates: Backbone.Collection.extend({
		model: Core.Models.JobState
	}),

	Contracts: Backbone.Collection.extend({
		model: Core.Models.Contract
	}),

	Ingresos: Backbone.Collection.extend({
		model: Core.Models.Ingreso
	}),

	Agents: Backbone.Collection.extend({
		model: Core.Models.Agent
	}),

	Registers: Backbone.Collection.extend({
		// params used for featch
		params: {},
		model: Core.Models.Register,

		url: "",

		urlParams: function() {
			return _.map(this.params, function(v, k) {
				return k + "=" + v;
			}).join("&");
		},

		sync: function(method, model, options) {
			if(this.params.date) {
				this.params.since = this.params.date;
				this.params.until = this.params.date;
				delete this.params.date;
			}

			options.url = this.url + "?" + this.urlParams();

			Backbone.sync(method, model, options);
		}
	})
}


// OBJETOS CORE
Core.session = new Core.Models.Session({id: "current"});
Core.session.fetch();




/*Core.session.on("change:status", function(session, status) {
	if(status === "connected")
		document.location.hash = "/app.html";
	else
		document.location.hash = "/login";
});*/


String.prototype.insertBetween = function (char, index) {
	return this.slice(0, index) + char + this.slice(index);
}




$("[data-action='logout']").click(function() {
	Core.session.destroy({
		success: function() {
			document.location.pathname = "/index.html";
		},
		error: function(msg, error) {
			console.log(error);
		}
	});
});