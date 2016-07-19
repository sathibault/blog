// predict.js - sample code to perform audio classification using the
// model generated with train.js from FFT data received from the MRK1000.

var fs = require('fs');
var restify = require('restify');
var convnetjs = require('convnetjs');

var SZ = 40;
var SHIFT = 1;

var net = new convnetjs.Net();
var str = fs.readFileSync('network.txt');
net.fromJSON(JSON.parse(str));

var winbuf = [];

logfile = fs.createWriteStream('predict.log', {flags:'w'});

function pickmax(scores) {
    var p = 0;
    var cl = -1;
    for (var i = 0; i < scores.length; i++) {
	if (scores[i] > p) {
	    p = scores[p];
	    cl = i;
	}
    }
    return cl;
}

function normvec(fft) {
    var max = 0;
    for (var i in fft) {
	if (fft[i] > max) max = fft[i];
    }
//    var max = 2500.0;
    return fft.map(x => x/max);
}

function predict(line) {
    var fft = line.toString().trim().split(", ");
    winbuf.push(normvec(fft));
    if (winbuf.length > SZ)
	winbuf.shift();
    if (winbuf.length < SZ)
	return 0;

    var v = new convnetjs.Vol(SZ, SZ, 1);
    var outp = 0;
    for (var i = 0; i < SZ; i++) {
	var row = winbuf[i];
	for (var j = 0; j < SZ; j++)
	    v.w[outp++] = row[SHIFT+j];
    }

    var scores = net.forward(v);
    return pickmax(scores.w);
}

function fftPost(req, resp, next) {
    var body = '';
    req.setEncoding('utf8');
    req.on('data', function (chunk) {
	body += chunk;
    });
    req.on('end', function () {
	var ans = predict(body);
	logfile.write(body+'\n');
	console.log(body);
	console.log(ans);
	resp.send(200,ans);
	return next();
    });
}

var options = {};
var server = restify.createServer(options);

server.post('/fft', fftPost);

server.listen(9000, function() {
    console.log('%s listening at %s', server.name, server.url);
});
