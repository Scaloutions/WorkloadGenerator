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

  totalLines.forEach(function (line, i) {
    var lineSplit = line.split(',');
    var stockRequest = {};
    var price = {};

    // Get stockRequest details
    getCommandDetails(lineSplit[0], stockRequest);
    stockRequest.UserId = lineSplit[1];

    if (lineSplit.length == 3) {
      // Info can be:
      //  Command + Username + Stock 
      //  Command + Username + Price
      var stockNameRegex = /([a-zA-Z][a-zA-Z ]{1,2})/g;
      var stockNameMatch = stockNameRegex.exec(lineSplit[2]);

      if (stockNameMatch && stockNameMatch[0].length <= 3) {
        stockRequest.Stock = stockNameMatch[0];
      } else {
        price = splitPrice(lineSplit[2]);
      }
    } else if (lineSplit.length == 4) {
      // Info can be:
      //  Command + Username + Stock + Price
      stockRequest.Stock = lineSplit[2]
      price = splitPrice(lineSplit[3]);
    }

    stockRequest.PriceDollars = price.dollars;
    stockRequest.PriceCents = price.cents;

    commandRequestsArray.push(stockRequest)

    // var reqOptions = {
    //   method: 'POST',
    //   uri: 'http://localhost:9090/api/' + stockRequest.Command.toLowerCase(),
    //   body: {
    //     userid: stockRequest.UserId,
    //     priceDollars: parseFloat(price.dollars),
    //     stock: stockRequest.Stock,
    //     command: stockRequest.Command,
    //     commandNumber: parseInt(stockRequest.CommandNumber)
    //   },
    //   json: true
    // }

    // var reqOptions = {
    //   method: 'GET',
    //   uri: 'http://localhost:9090/' + stockRequest.Command + stockRequest.CommandNumber,
    //   json: true
    // }

    // console.log('######## CALLING HTTP', 'http://localhost:9090/api/' + stockRequest.Command.toLowerCase());
    // request(reqOptions, function (error, response, body) {
    //   if (response.statusCode == 201) {
    //     console.log('how tho')
    //   } else {
    //     // console.log('\n error: '+ JSON.stringify(response))
    //     console.log('\n res: ' + response.statusCode);

    //     // console.log(body)
    //   }
    // })

    // console.log('######## DONE CALLING CALLING HTTP', stockRequest.CommandNumber);

    // httpstockRequest(reqOptions)
    //   .then(function(result) {
    //     console.log('a promise returned');
    //   })
    //   .catch(function(err) {
    //     console.log('a promise returned an erroe');

    //   })
    // httpRequests.push(httpRequest(reqOptions));

    // httpRequest(reqOptions)
    //   .then(function(results) {
    //     console.log('\n\n ## Results', results)
    //   })
    //   .error(function(err) {
    //     console.log(err)
    //   })
  })

  // response.writeHead(200, {'Content-Type': 'text/html'});
  // response.write(data);
  // response.end();
  // return requests;

  console.log('###### CALLING SEQUENTIAL HTTP EXECUTION')
  sequentialPromiseExecution(commandRequestsArray, 0);
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
    uri: 'http://localhost:9090/api/' + commandRequest.Command.toLowerCase() + commandRequest.CommandNumber,
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