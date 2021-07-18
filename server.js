var express = require('express');
var app = express();
var path = require('path');

app.use(express.static("dist"));

app.get('*', function (req, res) {
  res.sendFile('index.html',{root: path.join(__dirname, './dist')});
});

app.listen(3000, function () {
  console.log('App listening on port 3000');
});
