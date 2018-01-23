var bodyParser = require('body-parser'), // get body-parser
    config = require('./config'),
    services = require('./services');


module.exports = function(app, express) {
    var apiRouter = express.Router();

    apiRouter.get('/', function(req, res) {
        res.json({ message: 'Woohoooo! Welcome to our api!' })
    })

    apiRouter.get('/userload1', function(req, res) {

        // var requests = services.readFile();
        var requests = services.processFileContents();
        console.log('Requests are: ', requests);

        res.json({ testing: 'This is testing 1 user' });
    })

    return apiRouter;
}