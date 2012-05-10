// extend rut type
Byron.types.rut = {
	common: {
		label: "RUT",

		format: function(val) {
			if(val) {
				var clean = Byron.types.rut.common.clean(val);

				clean = clean.insertBetween("-", clean.length - 1);
				clean = clean.insertBetween(".", clean.length - 5);
				clean = clean.insertBetween(".", clean.length - 9);

				return clean;	
			}

			return "";
		},

		clean: function(val) {
			if(val === undefined)	val = "";

			return val.replace(/[^\dKk]/g, "");
		},

		validate: function(val) {
			// clean it
			var clean = this.clean(val);

			var digit = clean[clean.length - 1];

			// reverse it
			var process = Array.prototype.reverse.apply(clean.substring(0, clean.length - 1).split('')).join('');

			// multiplicar y sumar
			process = _.reduce(process.split(''), function(memo, d, i) {
				return memo + parseInt(d) * ((i % 6) + 2);
			}, 0);

			// resto
			var valid_digit = 11 - (process % 11);

			if(valid_digit == digit || (valid_digit == 11 && digit == 0) || (valid_digit == 10 && (digit == "K" || digit == "k")) )
				return true;

			return false;
		}
	},

	Form: {
		value: function(view) {
			return this.clean( Byron.types.string.Form.value.call(this, view) );
		}
	}
}

Byron.types.time = {
	Form: {
		render: function(view) {
			var hour = Byron.templates.select({
				name: this.name + "-hour", 
				options: _.map(_.range(0, 25), function(val) { return [val, val]; })
			});

			var minutes = Byron.templates.select({
				name: this.name + "-minutes", 
				options: _.map(["00", 15, 30, 45], function(val) { return [val, val]; })
			});

			return hour + minutes;
		},

		postRender: function(view) {
			view.$("[name='" + this.name + "-hour']").val(8);
		},

		value: function(view) {
			var hour = view.$("[name='" + this.name + "-hour']").val();
			var minutes = view.$("[name='" + this.name + "-minutes']").val();

			return hour + ":" + minutes;
		},
	}
};

Byron.types.job_state = {
	common: {
		type: "string",
		label: "Estado",
		render: function(view, val) {
			if(val === "rejected")
				return "<span class='label label-important'>rechazada</span>";

			if(val === "pending")
				return "<span class='label label-warning'>pendiente</span>";

			return "<span class='label label-success'>aceptada</span>";
		}
	}
}

Byron.types.user_state = {
	common: {
		type: "string",
		label: "Status",
		render: function(view, val) {
			if(val === "rejected")
				return "<span class='label label-important'>rechazada</span>";

			if(val === "pending")
				return "<span class='label label-warning'>pendiente</span>";

			return "<span class='label label-success'>autorizado</span>";
		}
	}
}


Fields = {
	Clerk: [
		{ 	
			bind: "rut",
			type: "rut"	
		},
		{ 	
			bind: "first_name",
			label: "Nombre"
		},
		{ 	
			bind: "last_name",
			label: "Apellido"
		},
		{ 	
			bind: "mother_name",
			label: "Apellido Materno"
		},
		{ 	
			bind: "mutual"
		},
		{	
			bind: "activity",
			label: "Cargo",
			values: ["Gerente", "Sub-Gerente", "Supervisor", "Vendedor"]
		},
		{	
			bind: "day_start_str",
			label: "Inicio",
			type: "time"
		},
		{	
			bind: "day_end_str",
			label: "Fin",
			type: "time"
		},
		{
			bind: "status_st",
			type: "user_state",
			exclude: true
		}
	],

	Job: [
		{ 
			bind: "nt_rut",
			type: "rut",
			label: "Rut"
		},
		{
			bind: "nt_name",
			label: "Nombre"
		},
		{ 
			bind: "nt_email",
			type: "email",
			label: "Email"
		},
		{
			bind: "nt_phone",
			label: "Teléfono"
		},
		{
			bind: "em_phone",
			label: "Teléfono Emergencia"
		},
		{
			bind: "sector",
			label: "Sector",
			help: "Sector donde se realizará el trabajo"
		},
		{
			bind: "start",
			label: "Inicio",
			type: "date"
		},
		{
			bind: "end",
			label: "Fin",
			type: "date"
		},
		{
			bind: "day_start_str",
			label: "Entrada",
			type: "time"
		},
		{ 
			bind: "day_end_str", 
			label: "Salida",
			type: "time" 
		}, 
		{ 
			bind: "description",
			label: "Descripción", 
			values: ["Vidrios", "Plomero", "Cerrajero", "Eléctrico", "Aseo", "Otros..."]
		},
		{ 
			bind: "status_str", 
			type: "job_state"
		}
	],

	Contract: [
		{
			bind: "rut",
			type: "rut"
		},
		{
			bind: "first_name",
			label: "Nombre"
		},
		{
			bind: "last_name",
			label: "Apellido"
		},
		{
			bind: "mother_name",
			label: "Apellido Materno"
		},
		{
			bind: "mutual",
			label: "Mutual"
		},
		{
			bind: "activity",
			label: "Descripción"
		}
	],

	Section: [
		{ 
			bind: "rut",
			type: "rut" 
		},
		{ 
			bind: "name", 
			label: "Nombre Fantasía"
		},
		{ 
			bind: "legal_name",
			label: "Razón Social"
		},
		{ 
			bind: "local_id",
			label: "Nº de Local"
		},
	 	{
			bind: "local_type",
			 exclude: true
		},
		{ 
			bind: "contact",
			label: "Contacto"
		},
		{ 
			bind: "phone",
			label: "Teléfono" 
		},
		{ 
			bind: "email",
			type: "email", label: "E-mail"
		 },
		{
			bind: "user",
			label: "Nombre de Usuario", exclude: true
	 	},
		{
			bind: "passwd",
	 		label: "Contraseña"
	 	}
	],

	Agent: [
		{	bind: "rut", 		type: "rut" 	},
		{	bind: "first_name",	label: "Nombre"	},
		{	bind: "last_name",	label: "Apellido"	},
	],

	Register: [
		{	bind: "access",		label: "Acceso"		},
		{	bind: "action_str",	label: "Acción"		},
		{	bind: "result_str",	label: "Resultado"	},
		{ 	bind: "rut",		type: "rut"			},
		{ 	bind: "first_name",	label: "Nombre"		},
		{ 	bind: "last_name",	label: "Apellido"	},
		{ 	bind: "mother_name",	label: "2do Apellido"	},
		{ 	bind: "mutual",		label: "Mutual"	},
		{	bind: "job_id",		label: "No de Solicitud"	},
		{	bind: "job_contact",	label: "Contacto"	},
		{	bind: "section_name",	label: "Empresa"	}
	]
}

Controls = {
	Form: {
		Clerk: Byron.View.Form.extend(		{ fields: Fields.Clerk }),
		Job: Byron.View.Form.extend(		{ fields: Fields.Job }),
		Contract: Byron.View.Form.extend(	{ fields: Fields.Contract }),
		Section: Byron.View.Form.extend(	{ fields: Fields.Section }),
		Agent: Byron.View.Form.extend(		{ fields: Fields.Agent })
	},

	Table: {
		Clerk: Byron.View.Table.extend(		{ fields: Fields.Clerk }),
		Job: Byron.View.Table.extend(		{ fields: Fields.Job }),
		Contract: Byron.View.Table.extend(	{ fields: Fields.Contract }),
		Section: Byron.View.Table.extend(	{ fields: Fields.Section }),
		Agent: Byron.View.Table.extend(		{ fields: Fields.Agent }),
		Register: Byron.View.Table.extend(	{ fields: Fields.Register })
	}
}
