var request = require('request');
var mongoose = require('mongoose');


suite('Api testing', function(){
	setup(function(){
	});
	teardown(function(done){
		mongoose.connection.close();
		done();
	});
	test('test eventos', function(done){
		request.get({
			url:'http://localhost:3000/eventos'
		}, function(error, response, body){
			if (!error && response.statusCode == 200) {
   				done();
   			}
		});
	});
});

//body: "type=1&data='{\"lala\":\"poto\"}'&label=huevapi&version=1"
//headers: {'content-type' : 'application/x-www-form-urlencoded'},