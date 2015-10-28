var stats = require('dashstats');
var winston = require('winston');
var twit = require('twit');

var http = require('http');

// A function to send a tweet to the NLP server and get a sentiment score

function getSentiment(data) {
    var options = {
        hostname: 'localhost',
        port: 9000,
        path: '/nlp/sentiment?social=1',
        method: 'POST',
        headers: {
            'Content-Type': 'text/plain',
            'Content-Length': Buffer.byteLength(data, 'utf8')
        }
    };


    var req = http.request(options, function(res) {
        res.setEncoding('utf8');
        var body = '';
        res.on('data', function (chunk) {
            body += chunk;
        });
        res.on('end', function () {
            // The NLP server returns -1, 0, or 1 sentitment score
            // Store the counts for each category in graphite
            res = parseInt(body);
            if (res > 0)
                stats.increment('sentiment.positive.count', 1);
            else if (res < 0)
                stats.increment('sentiment.negative.count', 1);
            else
                stats.increment('sentiment.neutral.count', 1);
        });
    });

    req.on('error', function(e) {
        errorLog.error('NLP Server error: ' + e);
    });

    req.write(data);
    req.end();
}

var tweetLog = new (winston.Logger)({
    transports: [
    new (winston.transports.DailyRotateFile)({
        filename: __dirname + '/tweets'
        })
    ]
});

var errorLog = new (winston.Logger)({
    transports: [
        new (winston.transports.File)({
            maxsize: 10*1024*1024,
            tailable: true,
            handleExceptions: true,
            filename: __dirname + '/twitter-error.log'
        })
    ]
});

var twitter = new twit({
  consumer_key: '',
  consumer_secret: '',
  access_token: '',
  access_token_secret: ''
});

stats.start();

var stream = twitter.stream('statuses/filter', { track: 'final fantasy', language: 'en' });

stream.on('tweet', function (tweet) {
    if (tweet.text) {
        if (tweet.text.search(/[hH][tT][tT][pP][sS]?:\/\//) < 0) {
            stats.increment('twitter.tweet.count',1);
            getSentiment(tweet.text);
        } else {
            stats.increment('twitter.spam.count',1);
        }
        tweetLog.info(tweet.text);
    }
});

stream.on('reconnect', function (request, response, interval) {
    errorLog.warn('RECONNECT in ' + interval);
});

stream.on('disconnect', function (msg) {
    errorLog.warn(msg);
});

stream.on('warning', function (warning) {
    errorLog.warn(warning);
});

