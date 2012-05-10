

/// SESSION

$('#session-loading').modal({
 	keyboard: false,
 	backdrop: "static",
 	show: true
});

Core.session.on("change:status", function(model, status) {
	if(status === "connected") {
		if(Core.session.user.roll.name === "site_manager") {
			// create this section
			site = new Core.Models.Site({id: Core.session.user.roll.site_id});

			site.fetch();

			// sections
			site.sections.fetch();		
			Sections.add.collection = site.sections;
			Sections.list.setCollection(site.sections)

			// jobs
			Jobs.list.table.setCollection(site.jobs);

			// clerks
			site.clerks.fetch();
			Clerks.add.collection = site.clerks;
			Clerks.list.setCollection(site.clerks);

			// agents
			site.agents.fetch();
			Agents.add.collection = site.agents;
			Agents.list.setCollection(site.agents);

			// reports
			Reports.day.jobs.url = site.jobs.url;
			Reports.contracts.registers.url = "/api/sites/" + site.id + "/access/jobs";
			Reports.clerks.registers.url = "/api/sites/" + site.id + "/access/clerks";

			$('#session-loading').modal("hide");
		}
		else {
			document.location.pathname = "/index.html";
		}
	}

	if(status === "not_connected") {
		alert("No estás conectado");
		document.location.pathname = "/index.html";
	}
});


var site = undefined;

Sections = {
	//agregar una empresa
	add: new (Controls.Form.Section.extend({
		el: "#sections-add form",

		toJSON: function() {
			var json = Controls.Form.Section.prototype.toJSON.call(this);
			json.user = site.attributes.uri + json.local_id;

			return json;
		}
	})),

	filter: new (Backbone.View.extend({
		el: "#sections-list form",

		events: {
			"submit": "search"
		},

		search: function() {
			var by = this.$("select").val();
			var key = this.$(".search-query").val();
			
			site.sections.reset();
			site.sections.fetch({ data: {by: by, key: key}});

			return false;
		}
	})),
	
	list: new Controls.Table.Section({
		el: "#sections-list .jobs.table",

		exclude: ["passwd", "rut", "legal_name", "email"],

		fields: {
			personal: {
				label: "",
				type: "button",
				content: "ver personal"
			},

			modify: {
				label: "",
				type: "button",
				content: "modificar"
			}
		},

		events: {
			"click [name='personal']": "showPersonal",
			"click [name='modify']": "modify"
		},

		handlers: {
			showPersonal: function() {
				this.model.clerks.fetch();

				Sections.personal.modal.show();
				Sections.personal.list.setCollection(this.model.clerks);
			},

			modify: function() {
				var model = this.model;

				Sections.modify.modal.show();
				Sections.modify.form.setModel(this.model);
				this.model.fetch({
					success: function() {
						Sections.modify.form.setModel(model);
					}
				});
			}
		}
	}),
	
	personal: {
		modal: new (Byron.View.Modal.extend({
			el: "#sections-clerks",
			title: "Personal de la Empresa",
			buttons: []
		})),

		list: new Controls.Table.Clerk({
			el: "#sections-clerks table",

			fields: {
				blocked: {
					type: "button",
					label: "Autorizado",
					size: "mini",
					index: 10000,
					render: function(view, val) {
						this.color = val ? "danger" : "success";
						this.content = "<i class='icon-white " + (val ? "icon-remove-sign" : "icon-ok-sign") + "'></i>";

						return Byron.types.button.common.render.apply(this, arguments);
					}
				}
			},

			events: {
				"click .btn[name='blocked']": "changeBlocked"
			},

			handlers: {
				changeBlocked: function() {
					var blocked = this.model.get("blocked");
					
					var sure = prompt("¿Seguro de modificar el bloqueo permanente?", "Agrega un comentario");
					
					if(sure) {
						this.model.set({blocked: !blocked});

						$.post("/api/sites/" + site.id + "/workers/" + this.model.get("worker_id") + "/notes", {
							effect_str: blocked ? "allowance" : "prohibition",
							comments: sure
						});
					}
				}
			}
		})
	},

	modify: {
		modal: new (Byron.View.Modal.extend({
			el: "#sections-modify",
			title: "Modifica la Sección",

			buttons: [
				{
					content: "guardar",
					click: function() {
						Sections.modify.form.model.save(Sections.modify.form.toJSON());
						this.close();
					}
				}
			]
		})),

		form: new Controls.Form.Section({
			el: "#sections-modify form",
			noButtons: true
		})
	}	
}


Jobs = {
	list: new (Backbone.View.extend({
		initialize: function() {
			$('a[href="#jobs-list"][data-toggle="tab"]').on('shown', function (e) {
				site.jobs.filter = $(this).data("filter");
				site.jobs.reset();
				site.jobs.fetch();
			});
		},

		table: new Controls.Table.Job({
			el: "#jobs-list .jobs",

			exclude: ["nt_rut", "nt_email", "nt_phone"],
		
			fields: {
				info: {
					name: "info",
					label: "",
					type: "button",
					content: "abrir"
				}
			},

			events: {
				"click [name='info']": "viewMore"
			},

			handlers: {
				viewMore: function() {
					Jobs.info.show(this.model);
				}
			}
		})
	})),

	info: new (Byron.View.Modal.extend({
		el: "#jobs-list .modal",

		onShown: function() {
			this.$(".info [name]").html("...");

			_.each(this.model.toJSON(), function(v, k) {
				var content = v;

				if(_.isDate(content))
					content = Byron.types.date.common.format(content);

				this.$(".info [name='" + k +"']").html(content || "...");
			}, this);

			Jobs.contracts.setCollection(this.model.contracts);
			this.model.fetch();
			this.checkButtons();	
		},

		buttons: [
			{
				color: "success",
				name: "accept",
				content: "Aceptar Solicitud",
				click: function() {
					var obs = prompt("Aceptar trabajo", "Comentario");

					if(obs) {
						this.model.changeState("accepted", obs);
						this.close();
					}
				}
			},
			{
				color: "danger",
				name: "reject",
				content: "Rechazar Solicitud",
				click: function() {
					var obs = prompt("Rechazar trabajo", "Comentario");

					if(obs) {
						this.model.changeState("rejected", obs);
						this.close();
					}
				}
			},
			{
				color: "warning",
				name: "pending",
				content: "Volver a Pendiente",
				click: function() {
					var obs = prompt("¿Estás seguro?", "Agrega un comentario");

					if(obs) {
						this.model.changeState("pending", obs);
						this.close();
					}
				}
			}
		],

		// revisa la visibildad de los botones según el tipo de filtro
		checkButtons: function() {
			var status = this.model.get("status_str");

			if(status === "pending") {
				this.buttons[0].hide = this.buttons[1].hide = false;
				this.buttons[2].hide = true;
			}
			else {
				this.buttons[0].hide = this.buttons[1].hide = true;
				this.buttons[2].hide = false;
			}

			this.renderButtons();
		}
	})),

	contracts: new Controls.Table.Contract({
		el: "#jobs-list .modal table",

		fields: {
			excluded: {
				index: 5,
				type: "checkbox",
				label: "Acceso",
				format: function(val) {
					return !val;
				}
			},

			blocked: {
				type: "button",
				label: "Autorizado",
				index: 10000,
				render: function(view, val) {
					this.color = val ? "danger" : "success";
					this.content = "<i class='icon-white " + (val ? "icon-remove-sign" : "icon-ok-sign") + "'></i>";

					return Byron.types.button.common.render.apply(this, arguments);
				}
			}
		},

		events: {
			"click .btn[name='blocked']": "changeBlocked",
			"change [name='excluded']": "changeExcluded"
		},

		handlers: {
			changeBlocked: function() {
				var blocked = this.model.get("blocked");
				
				var sure = prompt("¿Seguro de modificar el bloqueo permanente?", "Agrega un comentario");
				
				if(sure) {
					this.model.set({blocked: !blocked});

					$.post("/api/sites/" + site.id + "/workers/" + this.model.get("worker_id") + "/notes", {
						effect_str: blocked ? "allowance" : "prohibition",
						comments: sure
					});
				}
			},

			changeExcluded: function() {
				var excluded = this.model.get("excluded");
				var blocked = this.model.get("blocked");

				if(excluded && blocked) {
					var sure = prompt("Al autorizarlo para este trabajo, se quitará su bloqueo permanente", "Agrega un comentario");
					
					if(sure) {
						this.model.set({excluded: !excluded});

						$.post("/api/sites/" + site.id + "/workers/" + this.model.get("worker_id") + "/notes", {
							effect_str: "allowance",
							comments: sure
						});
					}
					else {
						this.render();
					}
				}
				else {
					this.model.set({excluded: !excluded});
				}
			}
		}
	})
}

Clerks = {
	// agregar un trabajador
	add: new Controls.Form.Clerk({
		el: "#clerks-add form"
	}),

	list: new Controls.Table.Clerk({
		el: "#clerks-list table",

		fields: {
			action: { type: "button", label: "", content: "desautorizar" }
		},

		events: {
			"click .btn": "destroy"
		}
	})
}

Agents = {
	// agregar un trabajador
	add: new Controls.Form.Agent({
		el: "#agents-add form"
	}),

	list: new Controls.Table.Agent({
		el: "#agents-list table",

		fields: {
			action: { type: "button", label: "", content: "desautorizar" }
		},

		events: {
			"click .btn": "destroy"
		}
	})
}


// REPORTS

Reports = {	

	day: new (Backbone.View.extend({
		el: "#reports-day",

		jobs: new Core.Collections.Jobs,

		list: new Controls.Table.Job({
			el: "#reports-day table"
		}),

		initialize: function() {
			this.list.setCollection(this.jobs);

			this.jobs.filter = "accepted";
			this.$("[data-obj='date']")
				.datepicker({
					dateFormat: "yy-mm-dd"
				})
				.datepicker("setDate", new Date)

			var self = this;

			Core.session.on("change:status", function(model, status) {
				if(status === "connected") {
					_.defer(function() {
						self.search();
					})
				}
			});


		},

		events: {
			"click .btn-primary": "search",
			"click .excel": "excel"
		},

		search: function() {
			this.jobs.date = this.$("[data-obj='date']").val();
			this.jobs.fetch();
		},

		excel: function() {
			var date = this.$("[data-obj='date']").val();

			this.$(".excel").attr("href", this.jobs.url + ".xls?filter=accepted&since=" + date + "&to=" + date );
		}
	})),

	contracts: new (Views.Register.extend({
		el: "#reports-controls",

		list: new Controls.Table.Register({
			el: "#reports-controls table"
		})
	})),

	clerks: new (Views.Register.extend({
		el: "#reports-clerks",

		list: new Controls.Table.Register({
			el: "#reports-clerks table",
			exclude: ["job_id", "job_contact"]
		})
	}))
}