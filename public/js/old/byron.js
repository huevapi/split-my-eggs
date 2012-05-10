String.prototype.insertBetween = function (char, index) {
	return this.slice(0, index) + char + this.slice(index);
}

Byron = {
	templates: {
		controlGroup: _.template(
			'<div class="control-group">' +
				'<label class="control-label"><%= label %></label>' +
				'<div class="controls">' +
					'<%= content %>' +
					"<% if (help) { %> <p class='help-block'> <%= help %> </p> <% } %>" +
				'</div>' +
			'</div>'
		),

		select: _.template(
			"<select name='<%= name %>'>" +
				"<% _.each(options, function(option) { %> <option value='<%= option[0] %>'><%= option[1] %></option> <% }); %>" +
			"</select>"
		)
	},

	types: {
		defaults: {
			common: {
				type: "string",

				format: function(val) {
					return val;
				},

				render: function(view, val) {
					return val;
				},

				validate: function(val) {
					return val.length > 0;
				}
			},

			Form: {
				render: function(view) {
					return view.make("input", { type: "text", name: this.name }).outerHTML;
				},

				help: false,

				postRender: function() {
					return false;
				},

				value: function(view) {
					return view.$("[name='" + this.name + "']").val();
				}
			}
		},

		string: {
			common: {},

			Form: {
				render: function(view) {
					if(this.values) {
						var options = _.map(this.values, function(val) {
							if(_.isArray(val))
								return val; 
							else
								return [val, val];
						});

						return Byron.templates.select({ name: this.name, options: options });
					}
					else
						return Byron.types.defaults.Form.render.call(this, view);
				},

				value: function(view) {
					return view.$("[name='" + this.name + "']").val();
				}
			}
		},

		email: {
			common: {
				type: "string"				
			}
		},

		date: {
			common: {
				type: "date",

				validate: function(val) {
					return _.isDate(val);
				},

				format: function(val) {
					return $.datepicker.formatDate("dd/mm/yy", val);
				}
			},


			Form: {
				value: function(view) {
					return view.$("[name='" + this.name + "']").datepicker("getDate");
				},

				postRender: function(view) {
					view.$("[name='" + this.name + "']").datepicker({
						dateFormat: "dd/mm/yy"
					});
				}
			}			
		},

		button: {
			common: {
				type: "button",
				size: "mini",
				color: "info",
				content: "botón",

				render: function(view) {
					return view.make("button", { "class": "btn" + " btn-"+this.color + " btn-"+this.size, name: this.name }, this.content);
				}
			}
		},

		checkbox: {
			common: {
				render: function(view, val) {
					var params = { type: "checkbox", name: this.name};
					if(val)	params.checked = "checked";

					return view.make("input", params);
				},

				value: function(view) {
					return view.$("[name='" + this.name + "']:checked").length > 0;
				}
			}
		}
	},

	fields: function(Control) {
		var index = 1;

		// to object with index
		this.fields = _.reduce(this.fields, function(memo, f) {
			var fcopy = _.clone(f);

			// name
			if(!fcopy.name)	fcopy.name = fcopy.bind;

			// index
			fcopy.index = index++ * 10;

			memo[fcopy.name] = fcopy;

			return memo;
		}, {});

		// include custom fields
		if(this.options.fields)
			_.each(this.options.fields, function(f, k) {
				if(this.fields[k])
					_.extend(this.fields[k], f);
				else
					this.fields[k] = _.extend({ name: k, index: 10000}, f);
			}, this);

		// complete fields with defaults
		_.each(this.fields, function(f) {
			// complete type and name
			if(!f.type)	f.type = "string";

			// complete with default type
			_.extend(f, _.extend({},	Byron.types.defaults.common, 
										Byron.types.defaults[Control] || {},
										Byron.types[f.type].common || {}, 
										Byron.types[f.type][Control] || {}, 
										f
			));		

			// label
			if(!f.label && f.label !== "")
				f.label = f.name.charAt(0).toUpperCase() + f.name.slice(1);
		}, this);	

		// exclude fields
		if(this.options.exclude)
				_.each(this.options.exclude, function(e) {
					this.fields[e].exclude = true;
				}, this);

		this.fields = _.reduce(this.fields, function(memo, f) {
			if(f.exclude !== true)
				memo[f.name] = f;

			return memo;				
		}, {});
	},

	sortedFields: function(fields) {
		return _.sortBy(fields, function(a) { return a.index; });
	}
}


Byron.View = {};

Byron.View.Form = Backbone.View.extend({
	fields: {},

	// no action buttons
	noButtons: false,

	render: function() {
		$(this.el).empty();

		_.each(Byron.sortedFields(this.fields), function(f) {
			// construct control groups, with label, content and help
			var $controlGroup = $(Byron.templates.controlGroup({
				label: f.label, 
				content: f.render.call(f, this),
				help: f.help
			}));

			$controlGroup.addClass("field-" + f.name);

			$(this.el).append($controlGroup);

			f.postRender.call(f, this);
		}, this);

		if(!this.noButtons) {
			var actions =
				this.make("button", { "class": "btn btn-large btn-primary", "data-loading-text": "..." }, "Guardar").outerHTML +
				this.make("button", { "class": "btn btn-large ", "data-loading-text": "..." }, "Limpiar").outerHTML

			$(this.el).append(this.make("div", { "class": "form-actions"}, actions));
		}		
	},

	save: function(params) {

		params = _.extend({
			context: this,
			
			$button: this.$(".form-actions .btn-primary"),

			success: function() {
				alert("guardado!");				
				params.$button.button('reset');
				this.clear();
			},

			error: function() {
				alert("hubo un error en el proceso");
				params.$button.button('reset');
			}
		}, params || {});

		if(this.validate()) {
			params.$button.button('loading');
			
			this.collection.create(this.toJSON(), {
				success: function() {
					params.success.call(params.context);
				},
				error: function() {
					params.error.call(params.context);
				}
			});
		}
		else
			alert("No se pudo guardar. Hay datos no válidos");
	},

	setModel: function(model) {
		this.model = model;
		var json = model.toJSON();

		_.each(this.fields, function(f) {
			this.$("[name='" + f.name + "']").val(json[f.name]);
		}, this);
	},

	validate: function() {
		return _.chain(this.fields)
					.map(function(f) {
						return f.validate(f.value.call(f, this));
					}, this)
					.all(function(v) {return v;})
					.value();
	},

	toJSON: function() {
		return _.reduce(this.fields, function(memo, f) {
			memo[f.name] = f.value.call(f, this);
			return memo;
		}, {}, this);
	},

	initialize: function(params) {
		Byron.fields.call(this, "Form");

		if(params && params.noButtons !== undefined)	this.noButtons = params.noButtons;

		this.render();
	},

	clear: function() {
		this.$("input").val("");
	},

	events: {
		"submit": "onSubmit",
		"change input": "onChange",
		"blur input": "onChange",
		"click .btn-primary": "onSave"
	},

	onSubmit: function() {
		return false;
	},

	onChange: function(e) {
		var $input = $(e.target);
		var field = this.fields[$input.attr("name")];
		var value = field.value.call(field, this);

		// format
		$input.val(field.format(value));

		// validation
		$input.closest(".control-group").toggleClass("error", !field.validate(value));
	},

	onSave: function(e) {
		this.save();
	}
});


Byron.View.ListItem = Backbone.View.extend({
	template: function(json) {
		return _.values(json).join(" - ");
	},

	initialize: function(params) {
		if(params) {
			this.fields = params.fields;
		}

		this.model.on("destroy", this.remove, this);
		this.model.on("change", this.render, this);
		this.model.on("sync", this.render, this);
	},

	render: function() {
		$(this.el).empty().append(this.template(this.model.toJSON()));
		return this;
	},

	destroy: function() {
		if(confirm("¿Estás seguro?")) {
			this.remove();
			this.model.destroy();
		}
	}
});

Byron.View.List = Backbone.View.extend({
	// default list item view
	ItemView: Byron.View.ListItem,

	appendTo: function() {
		return $(this.el);
	},

	// how to render a row
	addOne: function(model) {
		var view = new this.ItemView( {model: model, fields: this.fields} );
		this.appendTo().append(view.render().el);
	},

	// how to render everything
	render: function() {
		this.appendTo().empty();
		this.collection.each(this.addOne, this);
	},

	initialize: function() {
		if(this.collection)
			this.setCollection(this.collection);
	},		

	setCollection: function(collection) {
		// undo bindings
		if(this.collection) {
			this.collection.off("add", this.addOne, this);
	 		this.collection.off("reset", this.render, this);
		}

		// set collection
		this.collection = collection;

		// do bindings
		this.collection.on("add", this.addOne, this);
	 	this.collection.on("reset", this.render, this);

	 	this.render();
	}
});


Byron.View.Table = Byron.View.List.extend({
	fields: {},
 	
	appendTo: function() {
		return this.$("tbody");
	},

	initialize: function() {
		Byron.fields.call(this, "Table");

		// table structure
		var header = _.reduce(Byron.sortedFields(this.fields), function(memo, desc) {
			return memo + "<th>" + desc.label + "</th>";
		}, "");

		// insert table structure to dom
		$(this.el).html("<thead><tr>" + header + "</tr></thead><tbody></tbody>");

		// define item view
		var itemViewParams = {
			tagName: "tr",

			events: this.options.events || {},

			template: function(json) {
				_.each(Byron.sortedFields(this.fields), function(f) {
					$(this.el).append(this.make("td", {}, f.render.call(f, this, f.format(json[f.name]))));
				}, this);
			}
		}

		// extend events handlers
		_.extend(itemViewParams, this.options.handlers || {});

		this.ItemView = Byron.View.ListItem.extend(itemViewParams);

		Byron.View.List.prototype.initialize.call(this);
	}
});

Byron.View.Modal = Backbone.View.extend({
	title: false,

	body: "Contenido vacío",

	buttons: [
		{
			content: "Guardar",
			color: "primary",
			click: function() {
				alert("Guardar");
			}
		}
	],

	button_close: {
		content: "Cerrar",
		color: "default",
		click: function() {
			this.close();
		}
	},

	template: _.template(
		"<% if (title) { %>" +
		"<div class='modal-header'>" +
			"<a class='close' data-dismiss='modal'>×</a>" +
			"<h3><%= title %></h3>" +
		"</div>" +
		"<% } %>" +
		"<div class='modal-body'>" +
			"<%= body %>" +
		"</div>" +
		"<div class='modal-footer'></div>"
	),

	initialize: function() {
		var self = this;

		if($(this.el).html() !== "")
			this.body = $.trim($(this.el).html());

		this.render();

		$(this.el)
			.modal({
				backdrop: true,
				keyboard: true,
				show: false
			})
			.on("shown", function() {
				self.onShown.call(self);
			});
	},

	render: function() {
		$(this.el).html(this.template({ title: this.title, body: this.body }));
		this.renderButtons();
	},

	renderButtons: function() {
		this.$(".modal-footer").empty();

		_.each(_.union([this.button_close], this.buttons), function(b, i) {
			if(!b.hide) {
				if(!b.color)	b.color = "primary";
				if(!b.name)		b.name = "button--" + i;
				if(!b.content)  b.content = "botón " + i;

				this.$(".modal-footer").append(this.make("button", { "class": "btn btn-" + b.color, "data-index": i, "data-loading-text": "..." }, b.content));
			}
		}, this)
	},

	show: function(model) {
		this.model = model;
		$(this.el).modal("show");
	},

	onShown: function() {

	},

	close: function() {
		$(this.el).modal("hide");
	},

	events: {
		"click .modal-footer .btn": "buttonClick"
	},

	buttonClick: function(e) {
		var index = $(e.target).data("index");

		if(index)
			this.buttons[index - 1].click.call(this);
		// index == 0 is the close default button
		else
			this.button_close.click.call(this);
	}
});