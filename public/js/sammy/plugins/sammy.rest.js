(function($,undefined) {

	Sammy = Sammy || {};
	
	function replaceInUrl(_url, _data)
	{
//		while(var match = _url.match(/:\w+/)) {
//			var name = match
//			var name = match[0].slice(1);
//		}
		return _url;
	}
	
	// Sammy.RestAPI: rest api consumer helper.
	Sammy.Rest = function(_app) {
		
		var sequence = 1;
		
		// FORMAT RELATED.
		// TODO: Support formats other than json!.
		// ATENTION: json methods require the JSON plugin for some browsers.
		
		var content_type = 'application/json';
		var decode = JSON.parse;
		var encode = JSON.stringify;
		
		// MAIN METHOD.
		
		function run_jobs(_context, _id)
		{
			var job = _context.jobs[_id];
			_app.log('Rest ' + job.type + ' request to ' + job.url);
			$.ajax(job)
			// If everything goes right, store data in context
			// and move to next job. If all jobs are done, then 
			// invoke success callback on context.
			.done(function(_data) {
				_app.log('Request OK!');
				
				if(job.as) { // Prepare incoming data only if an alias is provided.
					_data = decode(_data);
					if(job.model) {
						if(job.type == 'GET') _data = job.model.filterDataIn(_data);
						else if(job.type == 'POST') _data = job.model.filterDataIn(_data, true);
						else if(job.type == 'PUT') _data = job.model.filterDataIn(_data);
					} 
					_context.context[job.as] = _data;
				}
				
				if(_id < _context.jobs.length-1) {
					run_jobs(_context, _id+1);
				} else {
					if(_context.seq != sequence) return;
					$.each(_context.success_cb, function(_i, _cb) {
						_cb.call(_context.context);
					});
					_app.trigger('rest-done');
				}
			})
			// In case of an error, stop the job queue, invoke error 
			// callbacks and trigger error events.
			.fail(function(_request, _type) {
				_app.log('Request failed!');
				if(_context.seq != sequence) return;
				$.each(_context.error_cb, function(_i, _cb) {
					_cb.call(_context.context, _request, _type);
				});
				_app.trigger('rest-error', { request: _request, type: _type });
				if(_type == 'error') _app.trigger('rest_error_' + _request.status, { request: _request });
			});
		}
		
		// REST CONTEXT CLASS
		
		// Rest request context holder.
		RestContext = function(_callContext) {
			this.seq = ++sequence;
			this.context = _callContext;
			this.jobs = [];
			this.success_cb = [];
			this.error_cb = [];
			this.running = false;
			// TODO: Options for this context
		};
		
		RestContext.prototype = {
			// Executes a get request.
			get: function(_urlOrModel, _as, _data) {
				var job = { type: 'GET', data: _data, dataType: 'text', cache: 'false', as: _as };
				if(_urlOrModel instanceof Node) {
					job['model'] = _urlOrModel;
					job['url'] = _urlOrModel.nodeUrl;
				} else job['url'] = replaceInUrl(_urlOrModel, _data);
				
				this.jobs.push(job);
				return this;
			},
			// Executes a post request
			post: function(_urlOrModel, _data, _as) {
				var job = { type: 'POST', contentType: content_type, dataType: 'text', cache: 'false', as: _as };
				if(_urlOrModel instanceof Node) {
					job['model'] = _urlOrModel;
					job['url'] = _urlOrModel.nodeUrl;
					job['data'] = _urlOrModel.filterDataOut(encode(_data), true); // Always expect one object
				} else {
					job['url'] = replaceInUrl(_urlOrModel, _data);
					job['data'] = encode(_data);
				}

				this.jobs.push(job);
				return this;
			},
			// Executes a put request
			put: function(_urlOrModel, _data, _as) {
				// TODO: Support fake PUTs
				var job = { type: 'PUT', contentType: content_type, dataType: 'text', cache: 'false', as: _as };
				if(_urlOrModel instanceof Node) {
					job['model'] = _urlOrModel;
					job['url'] = _urlOrModel.nodeUrl;
					job['data'] = _urlOrModel.filterDataOut(encode(_data)); // Number of objects depend on resource
				} else {
					job['url'] = replaceInUrl(_urlOrModel, _data);
					job['data'] = encode(_data);
				}
				
				this.jobs.push(job);
				return this;
			},
			// Executes a delete request
			del: function(_urlOrModel, _data) {
				// TODO: Support fake DELETEs
				var job = { type: 'DELETE', dataType: 'text', cache: 'false' };
				if(_urlOrModel instanceof Node) {
					job['model'] = _urlOrModel;
					job['url'] = _urlOrModel.nodeUrl;
				} else {
					job['url'] = replaceInUrl(_urlOrModel, _data);
				}

				this.jobs.push(job);
				return this;
			},
			
			then: function(_callback) {
				this.success_cb.push(_callback);
				return this.call();
			},
			error: function(_callback) {
				this.error_cb.push(_callback);
				return this.call();
			},
			call: function() {
				if(!this.running) {
					_app.trigger('rest-loading');
					run_jobs(this, 0);
					this.running = true;
				}
				return this;
			}
		};
		
		// NODE CLASS
		
		// This class is used to mantain the consumed rest model structure.
		Node = function(_url, _inCollection, _idOrInit) {
			
			if(_inCollection) {
				if(_idOrInit === undefined || typeof(_idOrInit) == 'function') {
					this.nodeUrl = _url; 		// Node url.
					this._init = _idOrInit; 	// Node initializer (only makes sense in collections).
					this.isCollection = true;	// Whether the node represents a collection or a single item.
				} else {
					this.nodeUrl = _url + '/' + _idOrInit;
					this.nodeId = _idOrInit;	// Node id (inside collection).
					this.isCollection = false;
				}
			} else {
				this.nodeUrl = _url;
				this.isCollection = false;
			}
			
			this._inFilters = [];				// Node input filters.
			this._outFilters = [];				// Node output filters.
		};
		
		Node.prototype = {
			
			// If this node is a collection, then a single item 
			// can be accessed through this method.
			getSingle: function(_id) {
				if(!this.isCollection) throw this.nodeUrl + " is not a collection.";
				ModelBuilder.currentNode = new Node(this._baseUrl, true, _id);
				if(this._init) this._init.call(ModelBuilder);
				return ModelBuilder.currentNode;
			},
			
			// Filters incomming data that belongs to this node.
			filterDataIn: function(_data, _expectItem) {
				if(this._inFilters.length > 0) {
					if(!_expectItem && this.isCollection) {
						var _this = this;
						$.each(_data, function(_k, _value) {
							$.each(_this._inFilters,function(_i,_filter) { _value = _filter(_value); });
							_data[_k] = _value;
						});
					} else $.each(this._inFilters,function(_i,_filter) { _data = _filter(_data); });
				}
				return _data;
			},
			
			// Filters outgoing data that belongs to this node.
			filterDataOut: function(_data, _expectItem) {
				if(this._inFilters.length > 0) {
					if(!_expectItem && this.isCollection) {
						var _this = this;
						$.each(_data, function(_k, _value) {
							$.each(_this._outFilters,function(_i,_filter) { _value = _filter(_value); });
							_data[_k] = _value;
						});
					} else $.each(this._outFilters,function(_i,_filter) { _data = _filter(_data); });
				}
				return _data;
			}
		}
		
		// MODEL BUILDER
		
		var ModelBuilder = {
			currentNode: null,
			
			// Adds a has many relation to the current node.
			// A has many relation provides a <name>([_id]) method for the node that
			// can be used to access the collection or a specific item if an id is given.
			hasMany: function(_url, _init, _name) {
				_name = _name || _url;
				ModelBuilder.currentNode[_name] = function(_id) {
					if(this.isCollection) throw this.nodeUrl + " is a collection.";
					ModelBuilder.currentNode = new Node(this.nodeUrl + '/' + _url, true, _id === undefined ? _init : _id);
					if(_init) _init.call(ModelBuilder); // Prepare the partial model route.
					return ModelBuilder.currentNode;
				};
			},
			
			// Adds a has one relation to the current node.
			// The has one relation provides a <name>() method for the node,
			// this allows to access the single resource item.
			hasOne: function(_url, _init, _name) {
				_name = _name || _url;
				ModelBuilder.currentNode[_name] = function() {
					if(this.isCollection) throw this.nodeUrl + " is a collection.";
					ModelBuilder.currentNode = new Node(this.nodeUrl + '/' + _url, false);
					if(_init) _init.call(ModelBuilder); // Prepare the partial model route.
					return ModelBuilder.currentNode;
				};
			},
			
			// Adds fields to be excluded before sending an object to the consumed service.
			addExcluded: function() {
				ModelBuilder.currentNode._outFilters.push(function(_data) {
					for(var i = 0; i < arguments.length; i++) {
						delete _data[arguments[i]];
					}
					return _data;
				});
			},
			
			// Adds a custom out filter, called on each object before is sent to the consumed service.
			addOutFilter: function(_filter) { ModelBuilder.currentNode._outFilters.push(_filter); },
			
			// Adds a custom in filter, called on each object after is received from the consumed service.
			addInFilter: function(_filter) { ModelBuilder.currentNode._inFilters.push(_filter); }
		}
		
		// EXTEND SAMMY APP.
		
		_app.buildModel = function(_baseUrl, _init) {
			ModelBuilder.currentNode = new Node(_baseUrl, false);
			if(_init) _init.call(ModelBuilder);
			return ModelBuilder.currentNode;
		};
		
		_app.helpers({
			// Creates a new rest context.
			rest: function() {
				return new RestContext(this);
			}
		});
		
		// If a route changes during a request, prevent request
		// callbacks from being executed.
		_app.bind('route-found', function() {
			sequence++;
		})
	};
	
}) (jQuery);