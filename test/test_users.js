var request = require('request');
var mongoose = require('mongoose');
var should = require('should');
var app = require('../app.js');

suite('Users resource', function(){
	setup(function(){
		mongoose.connection.close(function(){
			mongoose.connect(process.env.MONGOLAB_URI || "mongodb://localhost/mongo_test");
		});
	});
	teardown(function(done){
		User.remove({},function(err){
			done();
		});
	});
	
	test('test create/get user', function(done){
		request.post({
			url:'http://localhost:3000/users',
			body: "name=Pedro&email=pedro@spliter.com",
			headers: {'content-type' : 'application/x-www-form-urlencoded'}
		}, function(error, response, body){
			if (!error) {
   				response.statusCode.should.equal(204);
   				request.get({
					url:'http://localhost:3000/users',
				}, function(error, response, body){
					if (!error) {
		   				response.statusCode.should.equal(200);
		   				var users = JSON.parse(response.body);
		   				users.should.be.an.instanceof(Array);
		   				users[0].name.should.equal("Pedro");
		   				done();
		   			}
				});
   			}
		});
	});
	test('a repeated user should 403', function(done){
		request.post({
			url:'http://localhost:3000/users',
			body: "name=Pedro&email=juan@spliter.com",
			headers: {'content-type' : 'application/x-www-form-urlencoded'}
		}, function(error, response, body){
			if (!error) {
   				response.statusCode.should.equal(204);
   				request.post({
					url:'http://localhost:3000/users',
					body: "name=Juan&email=juan@spliter.com",
					headers: {'content-type' : 'application/x-www-form-urlencoded'}
				}, function(error, response, body){
					if (!error) {
						response.statusCode.should.equal(403);
						done();
		   			}
		   		});
   			}
		});
	});
	
});

//
//