// BASE SETUP
var express    = require('express'); 
var app        = express();       // define app using express
var bodyParser = require('body-parser');  // get body-parser
var morgan     = require('morgan');     // used to see requests
var config     = require('./config');
var path       = require('path');


// APP CONFIGURATION ==================
// use body parser to grab information from POST requests
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// configure app to handle CORS requests
app.use(function(req, res, next) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST');
  res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type, Authorization');
  next();
});

// log all requests to the console 
app.use(morgan('dev'));

// set static files location
// used for requests that our frontend will make
app.use(express.static(__dirname + '/public'));

// ROUTING FOR API =================
var apiRoutes = require('./routes')(app, express);

// All routes need to begin with /api/*
app.use('/api', apiRoutes);

// MAIN CATCHALL ROUTE
// has to be registered after API ROUTES
app.get('*', function(req, res) {
  res.json({ this: 'works'})
});

// START THE SERVER
app.listen(config.port);
console.log('Node Server Running on Port ' + config.port);