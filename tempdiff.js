var climate = require("climate-si7005")
var http = require('http');
var queue = require('queue-async')
var tessel = require('tessel');

var city = "Berkeley,CA";

function getInsideTemp (callback) {
  climate = climate.use(tessel.port('A'));
  climate.on('ready', function () {
    console.log('Connected to si7005');

    climate.readTemperature(function (err, temp) {
      console.log("sensor temp", temp);
      callback(null, Number(temp));
    });
  });

  climate.on('error', function(err) {
    console.log('error connecting module', err);
  });
};

function getOutsideTemp (callback) {
  console.log("getting");
  http.get("http://api.openweathermap.org/data/2.5/weather?q=" + city, function (res) {
    var bufs = [];
    res.on('data', function (data) {
      bufs.push(new Buffer(data));
      console.log('# received', new Buffer(data).toString());
  
      jsonresponse = JSON.parse(new Buffer(data).toString());
      console.log("web temp", jsonresponse.main.temp);
      callback(null, Number(jsonresponse.main.temp) - 272.15);
  
    })
    res.on('close', function () {
      console.log('done.');
    })
  }).on('error', function (e) {
    console.log('not ok -', e.message, 'error event')
  });
};

 function tempDiff (temp_outside, temp_inside) {
  console.log("outside temp:", temp_outside);
  console.log("inside temp:", temp_inside);
  console.log("It is " + (temp_inside - temp_outside) + " degrees hotter upstairs than outside!");
};

setImmediate(function flow () {
  var q = queue();
  q.defer(getOutsideTemp);
  q.defer(getInsideTemp);
  q.awaitAll(function(error, results) { 
    console.log("err", error);
    console.log("results", results);
    tempDiff(results[0], results[1]); });

});

