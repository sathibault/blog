// capture.js - sample code to capture FFT data from MRK1000 to use
// with train.js to train the neural network

var fs = require('fs');
var restify = require('restify');

logfile = fs.createWriteStream(process.argv[2], {flags:'a'});

function fftPost(req, resp, next) {
    var body = '';
    req.setEncoding('utf8');
    req.on('data', function (chunk) {
	body += chunk;
    });
    req.on('end', function () {
	logfile.write(body+'\n');
	console.log(body);
	resp.send({ok: 1});
	return next();
    });
}

var options = {};
var server = restify.createServer(options);

server.post('/fft', fftPost);

server.listen(9000, function() {
    console.log('%s listening at %s', server.name, server.url);
});
