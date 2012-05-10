
(function($, undefined) {
	
	var app = $.sammy(function() {
		this.use('Template');
		this.use('Json');
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

        this.get('#/logout', function(context) {
//			this.rest().del(model.sessions('current')).then(function() {
//				document.location.pathname = '/index.html';
//			});
		})
		
		this.get('#/users/:id/roles/new', function(context) {
//			var rest = this.rest().get(model.user(this.params['id']),'user');
//			if(this.params['sectionId']) rest.get(model.sites(this.params['siteId']).sections(this.params['sectionId']),'section');
//			else if(this.params['siteId']) rest.get(model.sites(this.params['siteId']),'site');
//			rest.then(function() { this.partial('/tmpl/admin/role-new.template'); });
		});
		
		this.bind('run', function(_event, _data) {
		});
		
	});

	// Start sammy app.
	$(function() { app.run('#/'); });
}) (jQuery);
