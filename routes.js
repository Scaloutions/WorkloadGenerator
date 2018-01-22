
var bodyParser = require('body-parser') // get body-parser
  , config = require('./config')
  , fs = require('fs')
  , path = require('path')
  , filePath = path.join(__dirname, '/workloads/1userWorkLoad.txt');


module.exports = function (app, express) {
  var apiRouter = express.Router();

  apiRouter.get('/', function (req, res) {
    res.json({ message: 'Woohoooo! Welcome to our api!' })
  })

  apiRouter.get('/userload1', function (req, res) {
    fs.readFile(filePath, { encoding: 'utf-8' }, function (err, data) {
      if (!err) {
        var allCommands = {};
        console.log('received data: ' + data);
        var lines = data.toString().split("\n");
        console.log('\n\n\n\n length is:', lines.length);
        lines.forEach(function (line, i) {

          var lineSplit = line.split(',');
          var commandAndNumberRegex = /(\[(\d*)\]) (\w*)/g;
          var commandNumber;
          var command;
          var commandNumberMatch = commandAndNumberRegex.exec(lineSplit[0]);
          var stock;
          var priceD;
          var priceC;
          if (commandNumberMatch && commandNumberMatch[2]) {
            commandNumber = commandNumberMatch[2]

            if (commandNumberMatch[3]) {
              command = commandNumberMatch[3];
            }
          }

          var userId = lineSplit[1];
          console.log('\n Line split length is: ', lineSplit.length);
          console.log(' Line split  is: ', lineSplit);
          console.log(' Command number is: ', commandNumber);
          console.log(' Command is: ', command);
          console.log(' User is: ', userId);

          
          if (lineSplit.length == 2) {
            // Info can be:
            //  Command + Username 
            //  Dumplog + filename

          } else if (lineSplit.length == 3) {
            // Info can be:
            //  Command + Username + Stock 
            //  Command + Username + Price
            
          } else if (lineSplit.length == 4) {
            // Info can be:
            //  Command + Username + Stock + Price
            stock = lineSplit[2]
            console.log(' Stock is: ', stock);
            console.log(splitPrice(lineSplit[3]));
          }
          
        })
        // response.writeHead(200, {'Content-Type': 'text/html'});
        // response.write(data);
        // response.end();
      } else {
        console.log(err);
      }
    });

    res.json({ testing: 'This is testing 1 user' })
  })

  function splitPrice(price) {
    var priceSplitRegex = /(\d*)(\.*)(\d*)/g;
    var priceMatch = priceSplitRegex.exec(price);
    // console.log(price)
    var price = {};
    price.dollars = priceMatch[1];

    if (priceMatch[2] && priceMatch[3]) {
      price.cents = priceMatch[3]
    }
    
    return price;
  }

  return apiRouter;
}