var express = require('express');
var fs = require('fs');
var http = require('http');
var app = express();

var configFolder = ".";
var dockerHost = "";

app.use(express.static('../client/'));

app.get('/list', function(req, res) {
    fs.readdir(configFolder, function(err, files) {
        if (err)
            console.error(err);

        res.json(files.filter(function(file) {
            var suffix = ".conf";
            return file.substr(-suffix.length) === suffix;
        }));
    });
});

app.get('/status/:config', function(req, res) {
    var config = req.params.config;
    // TODO
    http.request(dockerHost + "/containers/" + config + "/json").end();
});

app.get('/read/:config', function(req, res) {
    var config = req.params.config;

    if (config.slice(-1) != '/')
        config = '/' + config;

    fs.readFile(configFolder + config, 'utf-8', function(err, data) {
        if (err)
            console.error(err);

        res.send(data);
    })
});

app.listen(3000);