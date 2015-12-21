var nlp = require('lxnlp');
var readlines = require('n-readlines');

// Perform POS tagging on entire collection
var n_report = 10;

if (process.argv.length < 3) {
    console.log('Usage: node retweets.js <filename>')
    process.exit(1)
}

// Return true if A subset B or B subset of A
function match(A, B) {
    var pieces = A.intersect(B); // returns [A-B, A & B, B-A]
    return pieces[0].length == 0 || pieces[2].length == 0;
}

//
// Read the file and collect retweets grouped by author.
//

var total = 0;
var by_author = {};

var line;
var reader = new readlines(process.argv[2]);
while (line = reader.next()) {
    var entry = JSON.parse(line);
    var tweet = entry.message;

    // Retweets have the form "RT @username: text"
    if (tweet.search(/^RT @/) == 0) {
	var i = tweet.indexOf(': ');
	var author = tweet.substring(4,i);
	var text = tweet.substring(i+2).replace(/[ \n]+/g,' ');
	var doc = nlp.tokenize(text);

	// Clean data and create bag-of-words
	doc.removePunctuation()
	    .removeURL()
	    .filter(function (x) {
		return x.charCodeAt(x.length-1) != 8230;
	    })
	    .bag();

	if (author in by_author) {
	    // If we've already seen tweets by this author, try to match
	    // this tweet, to ones already seen.
	    var seen = by_author[author];
	    for (i = 0; i < seen.length; i++) {
		if (match(seen[i].doc, doc)) {
		    // We've seen this tweet, increment the count
		    seen[i].n += 1;
		    // if this copy is longer replace the one in the seen list.
		    if (doc.bag.length > seen[i].doc.bag.length)
			seen[i].doc = doc;
		    break;
		}
	    }
	    if (i == seen.length) {
		// Have not seen this one.
		seen.push({n: 1, doc: doc, text: text});
	    }
	} else {
	    // First tweet seen by author.
	    by_author[author] = [{n: 1, doc: doc, text: text}];
	}
    }
    total += 1;
}

console.log(total + ' total tweets');
console.log(Object.keys(by_author).length + ' authors');

//
// Collect all the tweets in by_author into a flat list of tweets.
//

var n = 0;
var uniq = 0;
var tweets = [];
for (author in by_author) {
    var author_tweets = by_author[author];
    uniq += author_tweets.length;
    for (var i = 0; i < author_tweets.length; i++) {
	n += author_tweets[i].n;
	tweets.push(author_tweets[i]);
    }
}

console.log(n + ' retweets');
console.log(uniq + ' unique retweets');

//
// Sort and report top tweets by frequency.
//

tweets.sort(function (a, b) {
    if (a.n < b.n) {
	return -1;
    }
    if (a.n > b.n) {
	return 1;
    }
    return 0;
});

n = (tweets.length > n_report) ? n_report : tweets.length;
for (var i = 0; i < n; i++) {
    var tweet = tweets.pop()
    console.log(tweet.n + ' ' + tweet.text);
}
