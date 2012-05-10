
// Current section
section = undefined;


Core.session.on("change:status", function(model, status) {
	if(status === "connected") {
		if(Core.session.user.roll.name === "section_manager") {
			// create this section
			section = new Core.Models.Section({id: Core.session.user.roll.section_id});
			
			// fetch informacion of their clerks
			section.clerks.fetch();

			// bind clerks to the control view
			Clerks.add.collection = section.clerks;
			Clerks.list.setCollection(section.clerks);

			Jobs.list.table.setCollection(section.jobs);
			Reports.clerks.registers.url = section.url() + "/access/clerks";
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



Clerks = {
	// agregar un trabajador
	add: new Controls.Form.Clerk({
		el: "#staff-add form"
	}),

	list: new Controls.Table.Clerk({
		el: "#staff-list table",

		fields: {
			status_st: { exclude: false},
			action: { type: "button", label: "", content: "desautorizar" }
		},

		events: {
			"click .btn": "destroy"
		}
	})
}

Jobs = {
	add: new (Backbone.View.extend({
		// the contract to add
		job: undefined,

		el: "#jobs-add",

		initialize: function() {
		  	this.job = new Core.Models.Job();
		  	this.contracts.add.collection = this.job.contracts;
			this.contracts.list.setCollection(this.job.contracts);

			$('a[href="#jobs-add"][data-toggle="tab"]').on('shown', function (e) {
				Jobs.add.modal.show();
			});
		},

		modal: new (Byron.View.Modal.extend({
			el: "#jobs-add .disclaimer",
			title: "Condiciones de Uso",

			buttons: [{
				content: "Aceptar",
				click: function() {
					Jobs.add.modal.close();
				}
			}]
		})),

		info: new Controls.Form.Job({
			el: "#jobs-add form.job-details",
			noButtons: true,

			fields: {
				status_str: { exclude: true }
			}
		}),

		contracts: {
			modal: new (Byron.View.Modal.extend({
				el: "#jobs-add .contract.modal",
				title: "Información del Trabajador",

				buttons: [{
					content: "Agregar",
					click: function() {						
						var contractJSON = Jobs.add.contracts.add.toJSON();

						Jobs.add.job.contracts.add(contractJSON);
						Jobs.add.contracts.add.clear();
						this.close();
					}
				}]
			})),

			add: new Controls.Form.Contract({
				el: "#jobs-add .contract.modal form",
				noButtons: true
			}),

			list: new Controls.Table.Contract({
				el: "#jobs-add .contracts-list"
			})
		},

		events: {
			"click [data-action='add-contract']": "showContractForm",
			"click [data-action='add']": "save"
		},

		showContractForm: function() {
			this.contracts.modal.show();
		},

		save: function(e) {
			var self = this;
			var $button = $(e.target);

			if(this.info.validate()) {
				$button.button('loading');
				
				this.job.set(this.info.toJSON());
				section.jobs.create(this.job, {
					success: function() {
						alert("trabajo agregado con éxito");
						$button.button('reset');

						self.info.clear();
						self.initialize();
					},
					error: function() {
						alert("hubo un error en el proceso");
					}
				});
			}
			else
				alert("No se pudo guardar. Hay datos no válidos");
		}
	})),
	
	list: new (Backbone.View.extend({
		initialize: function() {
			$('a[href="#jobs-list"][data-toggle="tab"]').on('shown', function (e) {
				section.jobs.filter = $(this).data("filter");
				section.jobs.fetch();
			});
		},

		table: new Controls.Table.Job({
			el: "#jobs-list table",

			exclude: ["nt_rut", "nt_email"]
		})
	}))
}

Reports = {
	clerks: new (Views.Register.extend({
		el: "#reports-clerks",

		list: new Controls.Table.Register({
			el: "#reports-clerks table",
			exclude: ["job_id", "job_contact", "section_name"]
		})
	})),
}