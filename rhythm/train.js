// train.js - sample code that trains a neural network from data
// recorded with capture.js for three different audio classes.

var fs = require('fs');
var convnetjs = require('convnetjs');
var readlines = require('n-readlines');

var SZ = 40;
var SHIFT = 1;

var ITER = 1200;
var V_ITER = 100;

tr_files = ['class1.log','class2.log', 'class3.log'];
tr_data = [];
vl_files = ['validation-class1.log','validation-class2.log','validation-class3.log'];
vl_data = [];

function normvec(fft) {
    var max = 0;
    for (var i in fft) {
	if (fft[i] > max) max = fft[i];
    }
    return fft.map(x => x/max);
}

function readfile(filename) {
    var line;
    var reader = new readlines(filename);
    var data = [];
    while (line = reader.next()) {
	var fft = line.toString().trim().split(", ");
	data.push(normvec(fft));
    }
    return data;
}

function getvol(data, num) {
    var v = new convnetjs.Vol(SZ, SZ, 1);
    var outp = 0;
    for (var i = 0; i < SZ; i++) {
	var line = data[num + i];
	for (var j = 0; j < SZ; j++)
	    v.w[outp++] = line[SHIFT+j];
    }
    return v;
}

function samplefile(data) {
    var n = data.length;
    var num = Math.floor(Math.random()*n);
    if ((num + SZ) > n)
	num = n - SZ;
    var v = new convnetjs.Vol(SZ, SZ, 1);
    var outp = 0;
    for (var i = 0; i < SZ; i++) {
	var line = data[num + i];
	for (var j = 0; j < SZ; j++)
	    v.w[outp++] = line[SHIFT+j];
    }
    return v;
}

for (i in tr_files)
    tr_data.push(readfile(tr_files[i]));
for (i in vl_files)
    vl_data.push(readfile(vl_files[i]));

layer_defs = [];
layer_defs.push({type:'input', out_sx:SZ, out_sy:SZ, out_depth:1});
layer_defs.push({type:'conv', sx:5, filters:16, stride:1, pad:2, activation:'relu'});
layer_defs.push({type:'pool', sx:2, stride:2});
layer_defs.push({type:'conv', sx:5, filters:16, stride:1, pad:2, activation:'relu'});
layer_defs.push({type:'pool', sx:2, stride:2});
layer_defs.push({type:'softmax', num_classes:tr_data.length});

net = new convnetjs.Net();
net.makeLayers(layer_defs);

trainer = new convnetjs.SGDTrainer(net, {method:'adadelta', batch_size:5, l1_decay:0.008});

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

function testall(classes) {
    var correct = classes.map(x => 0);
    var totals = classes.map(x => 0);
    for (var cl = 0; cl < classes.length; cl++) {
	var testdata = classes[cl];
	for (var i = 0; i < (testdata.length-SZ); i++) {
	    var v = getvol(testdata, i);
	    var scores = net.forward(v);
	    var cl2 = pickmax(scores.w);
	    if (cl == cl2)
		correct[cl]++;
	    totals[cl]++;
	}
    }
    for (var k = 0; k < correct.length; k++)
	correct[k] = correct[k] / totals[k];
    return correct;
}

function test(iter) {
    var i;
    var trright = 0;
    for (i = 0; i < V_ITER; i++) {
	var cl = Math.floor(Math.random()*tr_data.length);
	var v = samplefile(tr_data[cl]);
	var scores = net.forward(v);
	var cl2 = pickmax(scores.w);
	if (cl == cl2)
	    trright++;
    }

    var vlright = 0;
    for (i = 0; i < V_ITER; i++) {
	var cl = Math.floor(Math.random()*vl_data.length);
	var v = samplefile(vl_data[cl]);
	var scores = net.forward(v);
	var cl2 = pickmax(scores.w);
	if (cl == cl2)
	    vlright++;
    }
    console.log({'iter': iter, 'TR accuracy': trright/V_ITER,'VL accuracy': vlright/V_ITER});
}

for (i = 0; i < ITER; i++) {
    var cl = Math.floor(Math.random()*tr_data.length);
    v = samplefile(tr_data[cl]);
    var stats = trainer.train(v, cl);
    if (i % 100 == 0)
	test(i);
}
test(i);
var full = testall(vl_data);
console.log('Full:',full);

var json = net.toJSON();
outfile = fs.createWriteStream("network.txt", {flags:'w'});
outfile.write(JSON.stringify(json));
outfile.close();
