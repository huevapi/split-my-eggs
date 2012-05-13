var request = require('request');
var mongoose = require('mongoose');
var should = require('should');
var app = require('../app.js');

suite('Move resource', function(){
	setup(function(){
		mongoose.connection.close(function(){
			mongoose.connect(process.env.MONGOLAB_URI || "mongodb://localhost/mongo_test");
		});
		
	});
	teardown(function(done){
		Move.remove({},function(err){
			done();
		});
	});
	
	test('test create 2 users, create 1 move  / get move', function(done){
		request.post({
			url:'http://localhost:3000/users',
			body: "name=Pedro&email=jose@spliter.com",
			headers: {'content-type' : 'application/x-www-form-urlencoded'}
		}, function(error, response, body){
				request.post({
				url:'http://localhost:3000/users',
				body: "name=Juan&email=juan@spliter.com",
				headers: {'content-type' : 'application/x-www-form-urlencoded'}
			}, function(error, response, body){
					request.post({
						url:'http://localhost:3000/users',
						body: "to=jose@spliter.com&from=juan@spliter.com&amount=2000",
						headers: {'content-type' : 'application/x-www-form-urlencoded'}
					}, function(error, response, body){	
							request.get({
								url:'http://localhost:3000/moves',
							}, function(error, response, body){	
									response.statusCode.should.equal(200);
									done();
							});
				});
			});
		});
	});
	
});

//
//