
var bodyParser = require('body-parser') // get body-parser
  , config     = require('./config')

module.exports = function(app, express) {
  var apiRouter = express.Router();

  apiRouter.get('/', function (req, res) {
    res.json({ message: 'Woohoooo! Welcome to our api!'})
  })

  return apiRouter;
}