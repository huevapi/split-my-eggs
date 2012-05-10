
(function($, undefined) {
	
	var app = $.sammy(function() {
		this.use('Template');
		this.use('Json');
		this.use('Rest');
		
		this.element_selector = '#content-area'; // Must be set before SmartForms
		
		// ACTIONS
		
		this.get('#/', function(context) {
			this.partial('/tmpl/example.template');
		});
		
		this.get('#/event_list', function(context) {
            this.rest().get('/eventos/','event_set').then(function() {
                this.partial('/tmpl/event_list.template')
            })
		});
		
        this.get('#/event_form', function(context) {
            this.partial('/tmpl/event_form.template')
		});

        this.post('#/event_processing',function(context) {
            this.rest().post('/eventos/',this.params.toHash()).then(function() {
                this.partial('/tmpl/event_form.template')
            })
		});
		
        this.get('#/user_list', function(context) {
            this.rest().get('/users/','user_set').then(function() {
                this.partial('/tmpl/user_list.template')
            })
		});
		
        this.get('#/user_form', function(context) {
            this.partial('/tmpl/user_form.template')
		});

        this.post('#/user_processing',function(context) {
            this.rest().post('/users/',this.params.toHash()).then(function() {
                this.partial('/tmpl/user_form.template')
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
