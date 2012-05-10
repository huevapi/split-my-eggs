
/**
 * Module dependencies.
 */

var express = require('express')
, routes = require('./routes')
, mongoose = require('mongoose')
, evento = require('./controllers/evento');

mongoose.connect(process.env.MONGOLAB_URI || "mongodb://localhost/mongo_test");

var app = module.exports = express.createServer();

// Configuration

app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(express.static(__dirname + '/public'));
  app.use(app.router);
});

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

app.configure('production', function(){
  app.use(express.errorHandler());
});

// Models

global.Event=new require('./models/event')(mongoose);
global.User=new require('./models/user')(mongoose);

// How to use: Example 
// =======
// var event = new Event();
// event.version=12345;
// event.save(function(err) {
// });
// Event.find({}, function(err, docs) {
	// console.log(docs);
	// process.exit();
// });


// Routes

app.get('/', routes.index);
app.post('/evento', evento.post)

var port = process.env.PORT || 3000;
app.listen(port, function(){
  console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
});
