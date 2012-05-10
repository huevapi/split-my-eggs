var request = require('request');
var mongoose = require('mongoose');
var should = require('should');
var app = require('../app.js');

suite('Api testing', function(){
	setup(function(){
	});
	teardown(function(done){
		Evento.remove({},function(err){
			done();
		});
	});
	test('test get eventos', function(done){
		request.get({
			url:'http://localhost:3000/eventos'
		}, function(error, response, body){
			if (!error && response.statusCode == 200) {
   				done();
   			}
		});
	});
	test('test get eventos', function(done){
		request.post({
			url:'http://localhost:3000/eventos',
			body: "type=1&data={\"lala\":\"poto\"}&label=huevapi&version=1",
			headers: {'content-type' : 'application/x-www-form-urlencoded'}
		}, function(error, response, body){
			if (!error) {
   				response.statusCode.should.equal(204);
   				done();
   			}
		});
	});
	test('test create user', function(done){
		request.post({
			url:'http://localhost:3000/users',
			body: "name=Pedro&email=pedro@spliter.com",
			headers: {'content-type' : 'application/x-www-form-urlencoded'}
		}, function(error, response, body){
			if (!error) {
   				response.statusCode.should.equal(204);
   				done();
   			}
		});
	});
	test('test get users', function(done){
		request.get({
			url:'http://localhost:3000/users',
		}, function(error, response, body){
			if (!error) {
   				response.statusCode.should.equal(200);
   				done();
   			}
		});
	});
});

//
//