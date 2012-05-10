Views = {
	Register: Backbone.View.extend({

		registers: undefined,

		// Control Table of Registers
		list: undefined,

		initialize: function() {
			this.registers = new Core.Collections.Registers;
			this.list.setCollection(this.registers);

			this.$("input[name='date']").datepicker({
				dateFormat: "yy-mm-dd"
			});
		},

		events: {
			"click .btn-primary": "search",
			"click .excel": "excel"
		},

		setParams: function() {
			var params = {};

			this.$("input").each(function() {
				var value = $(this).val();

				if(value)
					params[$(this).attr("name")] = value;
			});

			this.registers.params = params;
		},

		search: function() {
			this.setParams();
			this.registers.fetch();
		},

		excel: function() {
			this.setParams();
			this.$(".excel").attr("href", this.registers.url + ".xls?" + this.registers.urlParams() );
		}
	}) 
}