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
    fs.readFileSync(filePath, (err, data) => {
      if (err) {
        return reject(err);
      }
      resolve(data);
    });
  });
}

function processFileContents(numberOfUsers) {
  var filePath;
  var parseLogs = false;
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
    case 100:
      console.log('User load: 100');
      filePath = path.join(__dirname, config.HundredUserWorkLoadPath)
      break;
    case 1000:
      console.log('User load: 1000');
      filePath = path.join(__dirname, config.ThousandUserWorkLoadPath)
      break;
    case "final":
      console.log('User load: final work load');
      filePath = path.join(__dirname, config.FinalUserWorkLoadPath)
      break;
    case "parse":
      console.log('parsing input file')
      filePath = path.join(__dirname, '10UserLogs')
      parseLogs = true
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

      commandRequestsArray.push(stockRequest)
    })

    sequentialPromiseExecution(commandRequestsArray, 0);
  }
}

function sequentialPromiseExecution(commandRequestsArray, index) {
  if (index >= commandRequestsArray.length) {
    console.log('### Reached end of requests!')
    return;
  }
  // console.log('Looking at request: ', commandRequestsArray[index], index)
  var commandRequest = commandRequestsArray[index];
  var reqOptions = {
    method: 'POST',
    uri: 'http://localhost:9090/api/' + commandRequest.Command.toLowerCase(),
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
        console.log('#ERROR')
    })
}

function getCommandDetails(firstSplitParam, request) {
  var commandAndNumberRegex = /(\[(\d*)\]) (\w*)/g;
  var commandNumberMatch = commandAndNumberRegex.exec(firstSplitParam);
  if (commandNumberMatch && commandNumberMatch[2]) {
    request.CommandNumber = commandNumberMatch[2]

    if (commandNumberMatch[3]) {
      request.Command = commandNumberMatch[3];
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