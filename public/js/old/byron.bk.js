/**
* Twitter Bootstrap templates
*/

BT_attr = function(name, fixed, conditional) {
	var value = "";

	if(fixed)
		_.each(fixed.split(" "), function(f) {
			if(f.indexOf("--") === -1)
				value += " " + f;
			else {
				var prefix = f.split("--");
				value += " " + prefix[0] + "-<%=" + prefix[1] + "%>";
			}
		});

	if(conditional)
		_.each(conditional.split(" "), function(f) {
			if(f.indexOf("--") === -1)
				value += "<% if (" + f + ") { %> <%=" + f + "%><% } %>";
			else {
				var prefix = f.split("--");
				value += "<% if (" + prefix[1] + ") { %> " + prefix[0] + "-<%=" + prefix[1] + "%><% } %>";
			}
		});

	return " " + name + "='" + value.trim() + "'";
}


BT = {

	tmpl: {

		fieldset: _.template(
			"<fieldset>" +
				'<% if (legend) { %> <legend> <%= legend %> </legend> <% } %>' +
				'<%= content %>' +
			"</fieldset>"
		),

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
			"<select name='<%= name %>' >" +
				"<% _.each(options, function(option) { %> <option value='<%= option[0] %>'><%= option[1] %></option> <% }); %>" +
			"</select>"
		),

		input: _.template(			
			"<input type='<%= type %>' name='<%= name %>' />"
		),

		textarea: _.template(			
			"<textarea name='<%= name %>' <% if (rows) { %> rows='<%= rows %>' <% } %>/>"
		),

		icon: _.template(
			"<i" + 
				BT_attr("class", "icon--type", "icon--color extraclass") +
			"></i>"),

		button: _.template(
			"<button <% if (name) { %> name='<%= name %>' <% } %>" +
				BT_attr("class", "btn", "btn--size btn--type extraclass") +
			"><%= content %></button>"
		)
	},

	DOM: {
		__clean: function(obj, params) {
			_.each(params, function(v) { if(obj[v] === undefined) obj[v] = false; });
		},

		/**
		* content: 	the content of the control group
		* help: 	the help section of the contro group
		* label:    the label section
		*/
		controlGroup: function(params) {
			this.__clean(params, ["help, label"]);

			return BT.tmpl.controlGroup(params);
		},

		/**
		* name: 	The attribute name
		* type:     The attribute type
		*/
		input: function(params) {
			return BT.tmpl.input(params);
		},

		/**
		* name: 	The attribute name
		* options:  An array of options [[value, text], ..]
		*/
		select: function(params) {
			return BT.tmpl.select(params);
		},

		/**
		* name: 	The attribute name
		* rows:     The attribute rows
		*/
		textarea: function(params) {
			return BT.tmpl.textarea(params);
		},

		/**
		* type: 		The icon to use
		* color: 		The color of the icon (try white)
		* extraclass: 	Everything extra on the class attribute
		**/
		icon: function(params) {
			this.__clean(params, ["color", "extraclass"]);

			return BT.tmpl.icon(params);
		},

		/**
		* name: 	The attribute name
		* content: 	The content of the button
		* size: 	The size of the button
		* type:     The size of the button (success, danger, etc..)
		**/
		button: function(params) {
			this.__clean(params, ["size", "extraclass", "type"]);

			return BT.tmpl.button(params);
		},

		/**
		* button:   Parameters of the button section
		* icon: 	Parameters of the icon section
		*/
		buttonicon: function(_button, _icon) {
			var button = _.clone(_button);

			button.content = this.icon(_icon) + " " + button.content;
			
			return this.button(button);
		}
	}
}


Byron = {
	types: {
		defaults: {
			type: "string",

			index: 500,

			input: {
				optional: false,

				validate: function(val) {
					return val.length > 0;
				},

				format: function(prop) {
					return prop.format.call(this, prop.input.value.call(this, prop));
				}
			},

			output: {
				render: function(prop, val) {
					return val;
				}
			},

			format: function(val) {
				return val;
			}
		},

		extend: function(params) {
			_.each(params, function(val, key) {
				var baseType = Byron.types[val.type] || {};

				Byron.types[key] = $.extend(true, {}, this.defaults, baseType, _.clone(val));
			}, this);
		}
	},

	structure: {
		// get
		get: function(Model, params) {
			if(Model.prototype._byron === undefined)
				this.setDefault(Model, {});

			this.fields = this.complete($.extend(true, {}, Model.prototype._byron, params));

			return _.reduce(this.fields, function(memo, val, key) {
				if(val.exclude !== true)	memo[key] = val;
				return memo;
			}, {});
		},

		// complete with defaults
		complete: function(params) {
			var result = {};

			_.each(params, function(prop, name) {
				// default string
				prop.type = prop.type || "string";

				prop = $.extend(true, {}, Byron.types[prop.type], prop);

				// a name is mandatory
				prop.name = name;

				// label
				if(prop.label !== "")
					prop.label = prop.label  || prop.name.charAt(0).toUpperCase() + prop.name.slice(1);

				result[name] = prop;
			});

			return result;	
		},

		setDefault: function(Model, params) {
			var defaults = _.reduce(Model.prototype.defaults, function(memo, val, key) {
			 	memo[key] = {};
			 	return memo;
			}, {});

			Model.prototype._byron = this.complete($.extend(true, params, defaults));
		}
	},

	View: {

		Form: Backbone.View.extend({
			definitions: [],

			// byron structure of each fields
			fields: {},

			/**
			* params.el
			* params.Model
			* params.extension
			*/
			initialize: function(params) {
				this.Model = params.Model;

				if(this.Model)
					this.fields = Byron.structure.get(this.Model, params.extension);
				else
					this.fields = Byron.structure.complete(params.extension);

				// process html
				var html = _.chain(this.fields)
								.sortBy(function(prop) { return prop.index; })
								.each(function(prop, name) {

									$(this.el).append(BT.DOM.controlGroup({
										label: prop.label, 
										content: prop.input.render.call(this, prop),
										help: prop.help
									}));

									if(prop.input.postRender)
										prop.input.postRender.call(this, prop);

								}, this)
								.value();

			},

			// return a json object of the form
			toJSON: function() {				
				return _.reduce(this.fields, function(memo, prop) {
					memo[prop.name] = prop.input.value.call(this, prop);
					return memo;
				}, {}, this);;
			},

			// save the model with the data in the form
			save: function() {
				this.model.save(this.toJSON());
			},

			events: {
				"blur .control-group": "check",
				"change .control-group input": "check"
			},

			check: function(e) {
				var $el = $(e.target);
				var name = $el.attr("name");
				var prop = this.fields[name];
				
				if(prop) {
					var value = prop.input.value.call(this, prop);

					$el.val(prop.input.format.call(this, prop));
					$el.closest(".control-group").toggleClass("error", !prop.input.validate(value));
				}			
			}
		}),
		
		TableRow: Backbone.View.extend({
			tagName: "tr",

			// byron strcture of each field
			fields: {},

			initialize: function(params) {
				this.fields = params.fields;

				this.model.on("destroy", this.remove, this);
				this.model.on("change", this.render, this);
				this.model.on("sync", this.render, this);

				// extension
				_.each(this.fields, function(f) {
					if(f.output.extend)	f.output.extend.call(this, f);
				}, this);
			},

			render: function() {
				$(this.el).empty();

				var json = this.model.toJSON();

				_.each(this.fields, function(f) {
					$(this.el).append(this.make("td", {}, f.output.render(f, f.format(json[f.name]))));
				}, this);

				return this;
			},

			events: {},

			destroy: function() {
				this.remove();
				this.model.destroy();
			}
		}),

		Table: Backbone.View.extend({
			// [Object] The byron description for the view
			_byron: {},

			initialize: function(params) {
				this.Model = params.Model;

				this.fields = Byron.structure.get(this.Model, params.extension);

				// table structure
				var header = _.reduce(this.fields, function(memo, desc) {
					return memo + "<th>" + desc.label + "</th>";
				}, "");

				// insert table structure to dom
				$(this.el).html("<thead><tr>" + header + "</tr></thead><tbody></tbody>");

				if(params.collection)
					this.setCollection(params.collection);
			},

			// how to render a row
			addOne: function(model) {
				var view = new Byron.View.TableRow({model: model, fields: this.fields});
				this.$("tbody").append(view.render().el);
			},

			// how to render everything
			render: function() {
				this.$("tbody").empty();
				this.collection.each(this.addOne, this);
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
		}),

		Modal: Backbone.View.extend({

			template: _.template(
				"<div class='modal-header'>" +
					"<a class='close' data-dismiss='modal'>×</a>" +
					"<h3><%= title %></h3>" +
					"</div>" +
  				"<div class='modal-body'>" +
    				"<%= body %>" +
  				"</div>" +
  				"<div class='modal-footer'>" +
    				"<a href='#' class='btn' data-dismiss='modal'>Cerrar</a>" +
    				"<a href='#' class='btn btn-primary' data-action='save'>Guardar</a>" +
  				"</div>"
			),

			initialize: function(params) {
				this.title = params.title;
				this.body = params.body;

				this.render();

				$(this.el).modal({
					backdrop: true,
					keyboard: true,
					show: false
				});

				if(params.initialize)
					params.initialize.call(this);

				if(params.save)
					this.save = params.save;
			},

			render: function() {
				$(this.el).html(this.template({ title: this.title, body: this.body }));
			},

			show: function(model) {
				this.model = model;
				$(this.el).modal("show");
			},

			close: function() {
				$(this.el).modal("hide");
			},

			events: {
				"click [data-action='save']": "save"
			},

			save: function() {}
		})
	}

}

Byron.types.extend({
	string: {
		type: "string",

		input: {
			render: function(prop) {
				if(prop.values && prop.values.length > 0) {
					var options = _.map(prop.values, function(val) {
						if(_.isArray(val))
							return val;

						return [val, val];
					});

					return BT.DOM.select({ name: prop.name, options: options });
				}
				else
					return this.make("input", { type: "text", name: prop.name }).outerHTML;
			},

			value: function(prop) {
				return this.$("[name='" + prop.name + "']").val();
			}
		}
	},

	date: {
		type: "date",

		input: {
			render: function(prop) {
				return Byron.types.string.input.render.call(this, prop);
			},

			value: function(prop) {
				return this.$("[name='" + prop.name + "']").datepicker("getDate");
			},

			validate: function(val) {
				return _.isDate(val);
			},

			postRender: function(prop) {
				this.$("[name='" + prop.name + "']").datepicker();
			}
		},

		format: function(val) {
			return $.datepicker.formatDate("dd/mm/yy", val);
		}
	},

	button: {
		type: "button",

		output: {
			render: function(prop, val) {
				var params = _.clone(prop);

				if(params.color)	params.type = params.color;
				if(val)				params.content = val;

				return BT.DOM.button(params);
			},

			extend: function(prop) {
				if(prop.action === "destroy")
					this.events["click [name='" + prop.name + "']"] = "destroy";				
			}
		}
	}
})

function serializeJSON(dom) {
	var result = {};

	$("[name]", dom).each(function() {
		result[$(this).attr("name")] = $(this).val("getDate");
	});

	return result;
}
