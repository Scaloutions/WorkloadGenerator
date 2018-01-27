'use strict';

var fs = require('fs'),
  path = require('path'),
  request = require('request'),
  config = require('./config'),
  Promise = require('promise'),
  Threads = require('webworker-threads'),
  httpRequest = require('request-promise'),
  filePath = path.join(__dirname, '/workloads/1userWorkLoad.txt');

function generateRequestFromFile() {
  return new Promise((resolve, reject) => {
    fs.readFileSync(filePath, (err, data) => {
      if (err) {
        return reject(err);
      }
      resolve(data);
    });
  });
}

function processFileContents() {
  var data = fs.readFileSync(filePath);
  var commandRequestsArray = [];
  var totalLines = data.toString().split("\n");
  console.log('\n Total Commands:', totalLines.length);

  commandRequestsArray.push({
    UserId: 'oY01WVirLr',
    Command: 'authenticate'
  });

  totalLines.forEach(function (line, i) {
    var lineSplit = line.split(',');
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

  console.log('###### CALLING SEQUENTIAL HTTP EXECUTION')
  sequentialPromiseExecution(commandRequestsArray, 0);
}

function sequentialPromiseExecution(commandRequestsArray, index) {
  if (index >= commandRequestsArray.length) {
    console.log('### Reached end of requests!')
    return;
  }
  var commandRequest = commandRequestsArray[index];
  console.log('Looking at request: ', commandRequestsArray[index], 'Calling: http://localhost:9090/api/' + commandRequest.Command)
  
  var reqOptions = {
    method: 'POST',
    uri: 'http://localhost:9090/api/' + commandRequest.Command,
    body: {
      userid: commandRequest.UserId,
      priceDollars: parseFloat(commandRequest.PriceDollars),
      stock: commandRequest.Stock,
      command: commandRequest.Command,
      commandNumber: parseInt(commandRequest.CommandNumber)
    },
    json: true
  }

  httpRequest(reqOptions)
    .then(function (result) {
      // if (result.statusCode == 200) {
      console.log('Results are:', result)
      sequentialPromiseExecution(commandRequestsArray, index + 1)
      // }
    })
    .catch(function (err) {
      console.log('#ERROR', err)
    })
}

function setCommandDetails(firstSplitParam, request) {
  var commandAndNumberRegex = /(\[(\d*)\]) (\w*)/g;
  var commandNumberMatch = commandAndNumberRegex.exec(firstSplitParam);
  if (commandNumberMatch && commandNumberMatch[2]) {
    request.CommandNumber = commandNumberMatch[2]

    if (commandNumberMatch[3]) {
      request.Command = commandNumberMatch[3].toLowerCase();
    }
  }
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
  processFileContents: processFileContents
};