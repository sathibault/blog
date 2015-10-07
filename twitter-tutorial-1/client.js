var stats = require('dashstats');
var winston = require('winston');
var twit = require('twit');

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
  consumer_key: '<consumer key>',
  consumer_secret: '<consumer secret>',
  access_token: '<your access token>',
  access_token_secret: '<your access token secret>'
});

stats.start();

var stream = twitter.stream('statuses/filter', { track: 'final fantasy', language: 'en' });

stream.on('tweet', function (tweet) {
    if (tweet.text) {
        if (tweet.text.search(/[hH][tT][tT][pP][sS]?:\/\//) < 0) {
            stats.increment('twitter.tweet.count',1);
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

