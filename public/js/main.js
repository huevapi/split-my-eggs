
(function($, undefined) {
	
	var app = $.sammy(function() {
		this.use('Template');
		this.use('JSON');
		this.use('Rest');
		
		this.element_selector = '#content-area'; // Must be set before SmartForms
		
		// ACTIONS
		
		this.get('#/', function(context) {
			this.redirect('#/event_list');
		});
		
		// ACTIONS: EVENTS
		
		this.get('#/event_list', function(context) {
            this.rest().get('/eventos/','event_set').then(function() {
                this.partial('/tmpl/event_list.template')
            })
		});
		
		this.post('#/event_processing',function(context) {
            this.rest().post('/eventos/',this.params.toHash()).then(function() {
            	this.redirect('#/event_list');
            })
		});
		
		// ACTIONS: USERS
		
        this.get('#/user_list', function(context) {
            this.rest().get('/users/','user_set').then(function() {
                this.partial('/tmpl/user_list.template')
            })
		});

        this.post('#/user_processing',function(context) {
            this.rest().post('/users/',this.params.toHash()).then(function() {
            	this.redirect('#/user_list');
            })
		});

        this.get('#/balance', function(context) {
            this.balance_set = {};
            var rest = this.rest().get('/users/','user_set');
            if (this.params.email){
                rest.get('/users/'+this.params.email+'/balances/','balance_set');
            }
            rest.then(function() {
                    this.partial('/tmpl/balance.template');});
        });

		// ACTIONS: MOVES
		
		 this.get('#/move_list', function(context) {
            this.rest().get('/moves','move_set').get('/users/','user_set').get('/eventos/','event_set').then(function() {
                this.partial('/tmpl/move_list.template')
            })
		});
		
		this.post('#/move_processing',function(context) {
            this.rest().post('/moves/',this.params.toHash()).then(function() {
            	this.redirect('#/move_list');
            })
		});
	});

	// Start sammy app.
	$(function() { app.run('#/'); });
}) (jQuery);
