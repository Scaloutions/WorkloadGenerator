'use strict';

var fs = require('fs'),
  path = require('path'),
  request = require('request'),
  config = require('./config'),
  Promise = require('promise'),
  Threads = require('webworker-threads'),
  httpRequest = require('request-promise'),
  _ = require('underscore');
  

function generateRequestFromFile() {
    return new Promise((resolve, reject) => {
        fs.readFile(filePath, (err, data) => {
            if (err) {
                return reject(err);
            }
            resolve(data);
        });
    });
}

function processFileContents(numberOfUsers) {
  var filePath;
  switch (numberOfUsers) {
    case 1:
      console.log('User load: 1');
      filePath = path.join(__dirname, config.OneUserWorkLoadPath)
      break;
    case 10:
      console.log('User load: 10');
      filePath = path.join(__dirname, config.TenUserWorkLoadPath)
      break;
    case 45:
      console.log('User load: 45');
      filePath = path.join(__dirname, config.FortyFiveUserWorkLoadPath)
      break;
    case 1000:
      console.log('User load: 1000');
      filePath = path.join(__dirname, config.ThousandUserWorkLoadPath)
      break;
    default:
      filePath = path.join(__dirname, config.OneUserWorkLoadPath)
  }


  var data = fs.readFileSync(filePath);
  var commandRequestsArray = [];
  var totalLines = data.toString().split("\n");
  console.log('\n Total Commands:', totalLines.length);

  commandRequestsArray.push({
    UserId: 'oY01WVirLr',
    Command: 'authenticate'
  });

  totalLines.forEach(function (line, i) {
    var lineSplit = line.trim().split(',');
    var stockRequest = {};
    var price = {};

    // Constructing Command Details

    // Set command name and number
    setCommandDetails(lineSplit[0], stockRequest);

    // Set user id
    stockRequest.UserId = lineSplit[1];

    if (lineSplit.length == 3) {
      // Info can be:
      //  Command + Username + Stock 
      //  Command + Username + Price

      // Match for stock or price
      var stockNameRegex = /([a-zA-Z][a-zA-Z ]{1,2})/g;
      var stockNameMatch = stockNameRegex.exec(lineSplit[2]);
      if (stockNameMatch && stockNameMatch[0].length <= 3) {
        // Set stock name
        stockRequest.Stock = stockNameMatch[0];
      } else {
        // Set price amount in dollars and cents
        price = splitPrice(lineSplit[2]);
        stockRequest.PriceDollars = price.dollars;
        stockRequest.PriceCents = price.cents;
      }
    } else if (lineSplit.length == 4) {
      // Info can be:
      //  Command + Username + Stock + Price
      // Set stock and price in dollars and cents
      stockRequest.Stock = lineSplit[2]
      price = splitPrice(lineSplit[3]);
      stockRequest.PriceDollars = price.dollars;
      stockRequest.PriceCents = price.cents;
    }

    commandRequestsArray.push(stockRequest)
  })

}

function sendRequest(request) {
    // TODO: //////////////////////////////////////////////////////////
    console.log(request.command);
}

function sendRequests(requests) {

    var numofRequests = requests.length;
    console.log("The number of requests are: ", numofRequests);

    var numOfThreads = 10;
    var threadsPool = Threads.createPool(numOfThreads);

    requests.forEach((request, index) => {
        (function(request) {
            // dispatch each request to the first available thread
            threadsPool.any.eval('sendRequest(' + request + ')', function(err, val) {

                if (request && request.command) sendRequest(request);
                // destroy the pool when all results have been produced
                if (index == numofRequests - 1) console.log('bye!'), threadsPool.destroy();
            });
        })(request);
    });

}

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

module.exports = {

    // readFile: readFile,
    processFileContents: processFileContents

};