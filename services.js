'use strict';

var fs = require('fs'),
    path = require('path'),
    filePath = path.join(__dirname, '/workloads/1userWorkLoad.txt');

var Promise = require('promise');

var requests = [];

function readFile() {

    fs.readFile(filePath, { encoding: 'utf-8' }, function(err, data) {
        if (!err) {
            var allCommands = {};
            console.log('received data: ' + data);
            var lines = data.toString().split("\n");
            console.log('\n\n\n\n length is:', lines.length);
            lines.forEach(function(line, i) {

                var lineSplit = line.split(',');
                var commandAndNumberRegex = /(\[(\d*)\]) (\w*)/g;
                var commandNumber;
                var command;
                var commandNumberMatch = commandAndNumberRegex.exec(lineSplit[0]);
                var stock;
                var priceD;
                var priceC;
                var price;
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
                    price = splitPrice(lineSplit[3]);
                    console.log(price);
                    priceD = price.dollars;
                    priceC = price.cents;
                }

                var request = {
                    command: command,
                    stock: stock,
                    userId: userId,
                    priceD: priceD,
                    priceC: priceC
                };

                console.log(' Request is: ', request);

                requests.push(request);
                // console.log(requests);

            })

            // response.writeHead(200, {'Content-Type': 'text/html'});
            // response.write(data);
            // response.end();
        } else {
            console.log(err);
        }

    });

    return requests;
}

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

function processFileContents() {
    generateRequestFromFile().then(data => {
        var allCommands = {};
        console.log('received data: ' + data);
        var lines = data.toString().split("\n");
        console.log('\n\n\n\n length is:', lines.length);
        lines.forEach(function(line, i) {

            var lineSplit = line.split(',');
            var commandAndNumberRegex = /(\[(\d*)\]) (\w*)/g;
            var commandNumber;
            var command;
            var commandNumberMatch = commandAndNumberRegex.exec(lineSplit[0]);
            var stock;
            var priceD;
            var priceC;
            var price;
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
                price = splitPrice(lineSplit[3]);
                console.log(price);
                priceD = price.dollars;
                priceC = price.cents;
            }

            var request = {
                command: command,
                stock: stock,
                userId: userId,
                priceD: priceD,
                priceC: priceC
            };

            console.log(' Request is: ', request);

            requests.push(request);

        })

        // response.writeHead(200, {'Content-Type': 'text/html'});
        // response.write(data);
        // response.end();
        return requests;
    }).then(requests => {
        console.log("Requests are: ==========================", requests);
    }).catch(err => {
        console.log(err);
        process.exit(1);
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

    readFile: readFile,
    processFileContents: processFileContents

};