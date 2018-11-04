var express = require('express');
var app = express();
const { fork } = require('child_process');

const process = fork('./automationServer.js');

app.get('/', function (req, res) {
  res.send('This is the automation server, francosta263');
});
app.listen(4000, function () {
  
})