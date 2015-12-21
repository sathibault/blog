var nlp = require('lxnlp');
var readlines = require('n-readlines');

// The number of entities/noun phrases reported
var n_report = 10;

if (process.argv.length < 3) {
    console.log('Usage: node topics.js <filename>')
    process.exit(1)
}

//
// Read the file and create a collection of tweets.
//

var count = 0;
var collection = nlp.collection();

var line;
var reader = new readlines(process.argv[2]);
while (line = reader.next()) {
    var entry = JSON.parse(line);
    var tweet = entry.message;

    // Exclude retweets and tweets with URLs (potential spam)
    if (tweet.search(/^RT @/) < 0 &&
	tweet.search(/http:/) < 0 &&
	tweet.search(/https:/) < 0) {
	var text = tweet.replace(/[ \n]+/g,' ');
	var doc = nlp.tokenize(text);
	collection.add(doc);
    }
    count += 1;
}

var m = collection.documents.length;
console.log(m + ' tweets');

// Perform POS tagging on entire collection
collection.postag();

//
// Report top entities by frequency
//

var n;
console.log('\tENTITIES');
var entities = collection.posNER();
n = (entities.length > n_report) ? n_report : entities.length;
for (var i = 0; i < n; i++) {
    var e = entities.pop();
    console.log((100*e[0]/m).toFixed(1) + '\t' + e[0] + '\t' + e[1]);
}

//
// Report top noun phrases by frequency
//

console.log('\tNOUN PHRASES');
var phrases = collection.posNP(true);
n = (phrases.length > n_report) ? n_report : phrases.length;
for (var i = 0; i < n; i++) {
    var np = phrases.pop();
    console.log((100*np[0]/m).toFixed(1) + '\t' + np[0] + '\t' + np[1]);
}
