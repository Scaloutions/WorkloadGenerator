'use strict';

var fs = require('fs'),
  path = require('path'),
  request = require('request'),
  config = require('./config'),
  Promise = require('promise'),
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
    case 2:
      console.log('User load: 2');
      filePath = path.join(__dirname, config.TwoUserWorkLoadPath)
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
      filePath = path.join(__dirname, config.ParseLogs)
      parseLogs = true
      break;
    default:
      filePath = path.join(__dirname, config.OneUserWorkLoadPath)
  }


  var data = fs.readFileSync(filePath);
  var commandRequestsArray = [];
  var totalLines = data.toString().split("\n");

  if (parseLogs == true) {
    console.log('Parsinglog file')
    var transactionNumberMap = {}
    var TNArray
    var sortedTransactionNumbers
    var missingTransactionNumbers = []
    totalLines.forEach(function(line, i) {
      var lineSplit = line.trim().split('<transactionNum>')
      if (lineSplit.length == 2) {
        var transactionNumber =  lineSplit[1].split('</transactionNum>')[0]
        transactionNumberMap[transactionNumber] = true;
        TNArray = _.keys(transactionNumberMap);
      }
        
    })

    sortedTransactionNumbers = _.sortBy(TNArray, function(num) {
        return parseInt(num);
    });

    var count = 1
    sortedTransactionNumbers.forEach(function(number) {
      if (number != count) {
        console.log("missing: ", count)
        missingTransactionNumbers.push(count)
        count = number
      } 
      count++;
      
    })

  } else {
    console.log('\n Total Commands:', totalLines.length);
    totalLines.forEach(function (line, i) {
      var lineSplit = line.trim().split(',');
      var stockRequest = {};
      var price = {};

      // Constructing Command Details

      // Set command name and number
      setCommandDetails(lineSplit[0], stockRequest);

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

    sequentialPromiseExecution(commandRequestsArray, 0);
  }
}

function sequentialPromiseExecution(commandRequestsArray, index) {
  if (index >= commandRequestsArray.length) {
    console.log('### Reached end of requests!')
    return;
  }
  var commandRequest = commandRequestsArray[index];
  console.log('Looking at request: ', commandRequestsArray[index], 'Calling: http://localhost:' + config.RPSPort + '/api/' + commandRequest.Command)
  
  var reqOptions = {
    method: 'POST',
    uri: 'http://localhost:'+ config.RPSPort + '/api/' + commandRequest.Command.toLowerCase(),
    // uri: 'http://192.168.1.137:'+ config.RPSPort + '/api/' + commandRequest.Command,
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