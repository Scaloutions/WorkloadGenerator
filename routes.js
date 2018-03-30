var bodyParser = require('body-parser'), // get body-parser
    config = require('./config'),
    services = require('./services');


module.exports = function(app, express) {
    var apiRouter = express.Router();

    apiRouter.get('/', function(req, res) {
        res.json({ message: 'Woohoooo! Welcome to our api!' })
    })

    apiRouter.get('/userload1', function(req, res) {
        services.processFileContents(1);

        res.json({ testing: 'This is testing 1 user' });
    })

    apiRouter.get('/userload2', function(req, res) {
        services.processFileContents(2);

        res.json({ testing: 'This is testing 1 user' });
    })

    apiRouter.get('/userload10', function(req, res) {
        services.processFileContents(10);

        res.json({ testing: 'This is testing 10 users' });
    })

    apiRouter.get('/userload45', function(req, res) {
        services.processFileContents(45);

        res.json({ testing: 'This is testing 1000 users' });
    })

    apiRouter.get('/userload1000', function(req, res) {
        services.processFileContents(1000);

        res.json({ testing: 'This is testing 1000 users' });
    })

    apiRouter.route('/')
        .post(function(req, res) {
            // console.log('This is command number', req.body);
            res.json(req.body);
        })

    return apiRouter;
}