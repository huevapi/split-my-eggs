(function($, undefined) {
	
	var app = $.sammy(function() {
		this.use('Template');
		this.use('BootstrapUtils', { smart_forms: true });
		this.use('SmartForms');
		this.use('MarkupTriggers');
		this.use('Rest');
		this.use('SubApp');
		this.use('Layers');
		this.use('JQueryMUI');
		this.use('KSEC');
		
		this.element_selector = '#content-area'; // Must be set before SmartForms
		
		// STATE AND ERROR HANDLING
		
		this.bind('reset-state', function() {
			// Remove status classes and show the loading page.
			this.layerOff();
			this.partial($('script#loading-page'));
		});
		
		this.bind('rest-loading', function() {
			this.layerOn('loading');
		});
		
		this.bind('rest-done', function() {
			this.layerOff();
		});
		
		this.bind('rest-error', function() {
			// TODO: Check error type.
			this.layerOn('error', { msg: 'Error de conexión' });
			$('#diag-feedback').layerOn('error', { msg: '<strong>Ups</strong>, Ocurrió un error inesperado.' })
		});
		
		this.bind('validation-error', function(_event, _data) {
			$('#diag-validation-error').modal();
		});
		
		this.bind('validated', function(_event, _data) {
			if(_data.error) _data.$target.closest('.control-group').addClass('error');
			else _data.$target.closest('.control-group').removeClass('error');
		});
		
		this.bind('refresh', function(_event, _data) {
			app.refresh();
		});
		
		this.get('#/logout', function(context) {
			this.trigger('reset-state');
			this.rest().del('/api/sessions/current').then(function() {
				document.location.pathname = '/index.html';
			});
		})
		
		this.get('#/', function(context) {
			this.redirect('#/jobs?filter=pending');
		});
		
		// SECTIONS
		
		// Main section screen, just loads the 'sections' sub
		this.get('#/sections', function(context) {
			this.trigger('reset-state');
			this.sub('sections');
		});
		
		this.addSubApp('sections', function() {
			var sections = null, page = 1, page_sz = 8;
			
			this.bind('sub-resume', function() {
				this.sections = sections;
				this.page = page;
				this.page_sz = page_sz;
				this.partial('/tmpl/sections.template');
			});
			
			this.bind('search', function(_ev, _data) {
				this.processForm('form', function(_data) {
					this.rest()
						.get(SECTIONS_RES,'sections',_data.toHash())
						.then(function() { 
							sections = this.sections;
							this.page = page = 1;
							this.page_sz = page_sz;
							this.partial('/tmpl/sections.template');
						});
				});
			});
			
			this.bind('page', function(_ev, _data) {
				this.sections = sections;
				this.page = page = _data.$target.data('page-num');
				this.page_sz = page_sz;
				this.partial('/tmpl/sections.template');
			});
		});
		
		// New section screen.
		this.get('#/sections/new', function(context) {
			this.trigger('reset-state');
			this.section = {}; // Defaults
			this.check = false;
			this.partial('/tmpl/section-edit.template');
		});
		
		this.post('#/sections', function(context) {
			this.processForm('form', function(_formData) {
				var newObj = _formData.toHash();
				newObj['user'] = SITE_CODE + '_' + newObj['local_id'] // TEMP: hardcoded site code.
				newObj['local_type'] = 'tienda';
				
				var rest = this.rest().post(SECTIONS_RES, newObj);
				this.feedbackDialog(rest, "Local creado exitosamente, se notificará al encargado.", '#/sections');
			});
		});
		
		this.get('#/sections/:id', function(context) {
			this.trigger('reset-state');
			this.rest()
				.get(SECTIONS_RES + '/' + this.params['id'],'section')
				.get(SECTIONS_RES + '/' + context.params['id'] + '/clerks','clerks')
				.then(function() { context.partial('/tmpl/section-details.template'); });
		});
		
		this.get('#/sections/:id/edit', function(context) {
			this.trigger('reset-state');
			this.rest()
				.get(SECTIONS_RES + '/' + this.params['id'],'section')
				.then(function() { 
					context.check = false;
					context.partial('/tmpl/section-edit.template'); 
				});
		});
		
		this.put('#/sections/:id', function(context) {
			this.processForm('form', function(_formData) {
				var newObj = _formData.toHash();
				newObj['user'] = SITE_CODE + '_' + newObj['local_id']
				var rest = this.rest().put(SECTIONS_RES + '/' + this.params['id'], newObj);
				this.feedbackDialog(rest, "Local modificado exitosamente, se notificará al encargado.", '#/sections/' + this.params['id']);
			});
		});
		
		this.bind('section-delete', function(e, data) {
			this.confirmBtnDialog('Eliminar Local', function() {
				var rest = this.rest().del(SECTIONS_RES + '/' + data.sectionId);
				this.feedbackDialog(rest, "Local eliminado exitosamente",'#/sections');
			});
		});
		
		// JOBS
		var last_job = null; // last viewed job details
		
		// New job screen.
		this.get('#/jobs/new', function(context) {
			this.trigger('reset-state');
			if(this.params['copy']) this.sub('job-edit', { copy: last_job });
			else this.sub('job-edit',{},true);
		});
		
		// New job app.
		this.addSubApp('job-edit', function() {
			var page = 'agree';
			var manager = { };
			var details = { contracts: [] };
			
			this.bind('sub-resume', function(_ev, _data) {
				if(_data && _data['copy']) {
					details = _data['copy'];
					manager = {};
					page = 'agree';
					
					// Clean extra job stuff, rails don like it.
					delete details['id'];
					delete details['section'];
					delete details['created_at'];
					delete details['changes'];
					
					var manager_idx = null;
					$.each(details.contracts, function(_i ,_contract) { 
						if(_contract.activity == 'Encargado') {
							manager = _contract;
							manager_idx = _i;
						}
						delete _contract['id'];
						delete _contract['worker_id'];
						delete _contract['blocked'];
						delete _contract['excluded'];
						delete _contract['notes'];
					});
					if(manager_idx !== null) delete details.contracts.splice(manager_idx,1);
				}
				this.trigger(page);
			});
			
			this.bind('agree', function(_ev, _data) {
				page = 'agree';
				this.partial('/tmpl/job-edit-agree.template');
			});
			
			this.bind('details', function(_ev, _data) {
				page = 'details';
				this.manager = manager;
				this.details = details;
				this.partial('/tmpl/job-edit-details.template');
			});
			
			this.bind('details-clean', function(_ev, _data) {
				manager = {};
				details = { contracts: details['contracts'] };
				this.trigger('details');
			});
			
			this.bind('details-done', function(_ev, _data) {
				this.processForm('#form-manager', function(_manager) {
					this.processForm('#form-details',function(_details) {
						manager = _manager.toHash();
						manager.activity = 'Encargado';
						
						_details = _details.toHash();
						if(_details.day_start > _details.day_end) _details.day_end += (24 * 3600);
						_details.nt_rut = manager.rut;
						_details.nt_name = manager.first_name + ' ' + manager.last_name;
						_details.contracts = details.contracts;
						details = _details;
						
						this.trigger('contracts');
					});
				});
			});
			
			this.bind('contracts', function(_ev, _data) {
				page = 'contracts';
				this.workers = $.merge([manager],details.contracts);
				this.partial('/tmpl/job-edit-workers.template');
			});
			this.bind('contracts-clean', function(_ev, _data) {
				details.contracts = [];
				this.workers = [manager];
				this.partial('/tmpl/job-edit-workers.template');
			});
			
			this.bind('contracts-done', function(_ev, _data) {
				var send = $.extend({}, details);
				send.contracts = $.merge([manager],details.contracts);
				var rest = this.rest().post(JOBS_RES, send);
				this.feedbackDialog(rest, "Solicitud enviada exitosamente", function() {
					page = 'agree';
					manager = {};
					details = { contracts: [] };
					this.redirect('#/jobs?filter=pending');
					updatePendingCount();
				});
			});
			
			this.bind('contract-delete', function(_ev, _data) {
				details.contracts.splice(_data.contractIdx - 1,1);
				this.workers = $.merge([manager],details.contracts);
				this.partial('/tmpl/job-edit-workers.template');
			});
			
			this.bind('contract-edit', function(_ev, _data) {
				if(_data.contractIdx !== undefined) {
					var contractIdx = _data.contractIdx - 1;
					this.worker = details.contracts[contractIdx];
					this.idx = contractIdx;
				} else {
					this.worker = {};
					this.idx = null;
				}
				this.partial('/tmpl/job-edit-workers-edit.template');
			});
			
			this.bind('contract-store', function(_ev, _data) {
				this.processForm('form', function(_data) {
					if(_data['index']) {
						details.contracts[_data['index']] = _data;
						delete _data['index'];
					} else details.contracts.push(_data);
					this.trigger('contracts');
				});
			});
		});
		
		// Job search screen.
		this.get('#/jobs', function(context) {
			this.trigger('reset-state'); // This should be shown only if page changes...
			var query = this.cleanParams({ page: 0 });
			if(query.day == 'today') query.day = $.datepicker.formatDate('yy-mm-dd', new Date());
			if(query.day) $.extend(query, { since: query.day, until: query.day });
			this.rest()
				.get(JOBS_RES,'jobs', query)
				.then(function() {
					this.xlsUrl = JOBS_RES + '.xls?' + $.param(query);
					this.pdfUrl = JOBS_RES + '.pdf?' + $.param(query);
					this.lastUrl = (query.page > 0) ? '#/jobs?' + $.param($.extend({}, query, {page: parseInt(query.page)-1})) : null;
					this.nextUrl = (this.jobs.length >= PAGE_SZ) ? '#/jobs?' + $.param($.extend({}, query, {page: parseInt(query.page)+1})) : null;
					this.query = query;
					this.partial('/tmpl/jobs.template');
				});
		});
		
		// Job details screen.
		this.get('#/jobs/:id', function(context) {
			this.trigger('reset-state');
			this.sub('job-state', { job_id: this.params['id'] });
		});
		
		// Job review app.
		this.addSubApp('job-state', function() {
			var job = null;
			
			this.bind('sub-resume', function(_ev, _data) {
				this.rest()
					.get(JOBS_RES + '/' + _data.job_id, 'job')
					.then(function() {
						job = last_job = this.job;
						job.pending = (job.status_str === undefined || job.status_str == 'reset' || job.status_str == 'pending')
						this.partial('/tmpl/job-details.template');
					});
			});
			
			this.bind('authorize', function(_ev, _data) {
				var contract = job.contracts[_data.contractIdx];
				if(contract.blocked) {
					this.processDialog('#diag-unblock', function(_data, $_dialog) {
						_data.effect_str = 'allowance';
						this.rest()
							.post(WORKERS_RES + '/' + contract.worker_id + '/notes', _data)
							.then(function() { 
								$_dialog.modal('hide');
								contract.blocked = false;
								contract.excluded = false;
								this.job = job;
								this.partial('/tmpl/job-details.template');
							});
					});
				} else {
					contract.excluded = false;
					this.job = job;
					this.partial('/tmpl/job-details.template');
				} 
			});
			
			this.bind('block', function(_ev, _data) {
				var contract = job.contracts[_data.contractIdx];
				contract.excluded = true;
				this.job = job;
				this.partial('/tmpl/job-details.template');
			});
			
			this.bind('ban', function(_ev, _data) {
				var contract = job.contracts[_data.contractIdx];
				this.processDialog('#diag-block',function(_data, $_dialog) {
					_data.effect_str = 'prohibition';
					this.rest()
					.post(WORKERS_RES + '/' + contract.worker_id + '/notes', _data)
					.then(function() {
						$_dialog.modal('hide');
						contract.blocked = true;
						this.job = job;
						this.partial('/tmpl/job-details.template');
					});
				});
			});
			
			this.bind('update-job', function(_ev, _data) {
				this.processForm('form', function(_state) {
					_state.status_str = _data.newStatus;
					_state.exclude = [];
					$.each(job.contracts, function(_i, _contract) {
						if(_contract.blocked || _contract.excluded) _state.exclude.push(_contract.id);
					});
					var rest = this.rest().post(JOBS_RES + '/' + job.id + '/states',_state);
					var next = _data.newStatus == 'pending' ? function() { app.refresh(); } : '#/jobs?filter=' + _data.newStatus;
					this.feedbackDialog(rest, "Solicitud actualizada con exito.", next);
				});
			});
		});
		
		// CLERKS
		
		this.get('#/clerks', function(context) {
			this.trigger('reset-state');
			this.rest()
				.get(CLERKS_RES,'clerks')
				.then(function() {
					this.partial('/tmpl/clerks.template');
				});
		});
		
		this.get('#/clerks/edit', function(context) {
			this.trigger('reset-state');
			this.clerk = {};
			this.partial('/tmpl/clerk-edit.template');
		});

		this.get('#/clerks/edit/:id', function(context) {
			this.trigger('reset-state');
			this.rest()
				.get(CLERKS_RES + '/' + this.params['id'],'clerk')
				.then(function() {
					this.partial('/tmpl/clerk-edit.template');
				});
		});
		
		this.post('#/clerks', function(context) {
			this.processForm('form', function(_data) {
				if(_data.day_start >= _data.day_end) _data.day_end += (24 * 3600);
				var rest = this.rest().post(CLERKS_RES, _data);
				this.feedbackDialog(rest, "Personal registrado con exito.", '#/clerks');
			});
		});
		
		this.put('#/clerks/:id', function(context) {
			this.processForm('form', function(_data) {
				if(_data.day_start >= _data.day_end) _data.day_end += (24 * 3600);
				var rest = this.rest().del(CLERKS_RES + '/' + this.params['id']).post(CLERKS_RES, _data);
				this.feedbackDialog(rest, "Personal actualizado con exito.", '#/clerks');
			});
		});
		
		this.bind('clerks-delete', function() {
			
			// Search selected personel.
			var clerks = [];
			this.$element().find('input[data-clerk-id]:checked').each(function(_i, _el) {
				clerks.push($(_el).data('clerk-id'));
			});
			
			// Confirm action.
			if(clerks.length > 0) {
				this.confirmBtnDialog('Eliminar Personal', function() {
					var rest = this.rest();
					for(var i = 0; i < clerks.length; i++) { rest = rest.del(CLERKS_RES + '/' + clerks[i]); }
					this.feedbackDialog(rest, "Local eliminado exitosamente", function() { app.refresh(); });
				});
			}
		});
		
		// GUARDS
		
		this.get('#/agents', function(context) {
			this.trigger('reset-state');
			this.rest()
				.get(AGENTS_RES,'agents')
				.then(function() {
					this.partial('/tmpl/agents.template');
				});
		});
		
		this.get('#/agents/new', function(context) {
			this.trigger('reset-state');
			this.agent = {};
			this.partial('/tmpl/agent-edit.template');
		});
		
		this.post('#/agents', function(context) {
			this.processForm('form', function(_data) {
				var rest = this.rest().post(AGENTS_RES, _data);
				this.feedbackDialog(rest, "Guardia agregado con exito.", '#/agents');
			});
		});
		
		this.bind('agent-delete', function(_ev, _data) {
			this.confirmBtnDialog('Eliminar Guardia', function() {
				var rest = this.rest().del(AGENTS_RES + '/' + _data.agentId);
				this.feedbackDialog(rest, "Guardia eliminado con exito.", '#/agents');
			});
		});
		
		// ACCESS REPORTS
		
		// Contractors access report.
		this.get('#/reports/access/jobs', function(context) {
			var query = this.cleanParams({ page: 0 });
			if(query.day) $.extend(query,{ since: query.day, until: query.day });
			this.trigger('reset-state');
			this.rest()
				.get(ACCESS_RES + '/' + 'jobs','entries', query)
				.then(function() {
					this.xlsUrl = ACCESS_RES + '/' + 'jobs.xls?' + $.param(query);
					this.pdfUrl = ACCESS_RES + '/' + 'jobs.pdf?' + $.param(query);
					this.lastUrl = (query.page > 0) ? '#/reports/access/jobs?' + $.param($.extend({}, query, {page: query.page-1})) : null;
					this.nextUrl = (this.entries.length > 5) ? '#/reports/access/jobs?' + $.param($.extend({}, query, {page: query.page+1})) : null;
					this.query = query;
					this.partial('/tmpl/report-access-jobs.template');
				});
		});
		
		// Clerk access report.
		this.get('#/reports/access/clerks', function(context) {
			var query = this.cleanParams({ page: 0 });
			this.trigger('reset-state');
			this.rest()
				.get(ACCESS_RES + '/' + 'clerks', 'entries', query)
				.then(function() {
					this.xlsUrl = ACCESS_RES + '/' + 'clerks.xls?' + $.param(query);
					this.pdfUrl = ACCESS_RES + '/' + 'clerks.pdf?' + $.param(query);
					this.lastUrl = (query.page > 0) ? '#/reports/access/clerks?' + $.param($.extend({}, query, {page: query.page-1})) : null;
					this.nextUrl = (this.entries.length > 5) ? '#/reports/access/clerks?' + $.param($.extend({}, query, {page: query.page+1})) : null;
					this.query = query;
					this.partial('/tmpl/report-access-clerks.template');
				});
		});
		
		// WORKERS
		
		this.bind('worker-block', function(e, _data) {
			var comments = prompt('Ingrese la razón del bloqueo',''); // TEMP: Use other kind of UI.
			if(comments) {
				var data = { effect_str: 'prohibition', comments: comments };
				this.rest()
					.post(WORKERS_RES + '/' + _data.$target.data('worker-id') + '/notes', data)
					.then(function() { app.refresh(); });
			}
		});
		
		this.bind('worker-unblock', function(e, _data) {
			var comments = prompt('Ingrese la razón del desbloqueo',''); // TEMP: Use other kind of UI.
			if(comments) {
				var data = { effect_str: 'allowance', comments: comments };
				this.rest()
					.post(WORKERS_RES + '/' + _data.$target.data('worker-id') + '/notes', data)
					.then(function() { app.refresh(); });
			}
		});
		
	});
	
	// Start sammy app.
	$(function() { app.run('#/'); });
})(jQuery);