var express = require("express");
var config = require('./config.json');
var fs = require("fs");
var http = require("http");
var app = express();

var docker = config.docker;
var folders = config.folders;

app.use(express.static("../client/"));

app.get("/list", function(req, res) {
    fs.readdir("/config", function(err, files) {
        if (err)
            console.error(err);

        res.json(files.filter(function(file) {
            var suffix = ".conf";
            return file.substr(-suffix.length) === suffix;
        }));
    });
});

app.get("/status/:config", function(req, res) {
    var config = req.params.config;

    var options = {
        host: docker.host,
        path: "/containers/logstash-" + config + "/json",
        port: docker.port,
        method: "GET"
    };

    http.request(options, function(response) {
        var statusCode = response.statusCode;
        var content = "";
        if (statusCode < 200 || statusCode > 299) {
            res.json({status: "available"});
        } else {
            response.on("data", function(chunk) {
                content += chunk;
            });

            response.on("end", function() {
                var data = JSON.parse(content);

                if (data.State && data.State.Status && data.State.Status === "running") {
                    res.json({status: "active"});
                } else {
                    res.json({status: "bugged"});
                }
            });
        }
    }).end();
});

app.get("/active/:config", function(req, res) {
    var config = req.params.config;

    var options = {
        host: docker.host,
        path: "/containers/create?name=logstash-" + config,
        port: docker.port,
        method: "POST",
        json: true,
        body: JSON.stringify({
            Image: "logstash:latest",
            Mounts: [
                {
                    Source: folders.data,
                    Destination: "/data"
                },
                {
                    Source: folders.config,
                    Destination: "/config"
                }
            ],
            Cmd: ["logstash", "-f", "/config/" + config]
        })
    };

    http.request(options, function(response) {
        var statusCode = response.statusCode;
        var content = "";
        if (statusCode < 200 || statusCode > 299) {
            res.json({status: "active"});
        } else {
            res.json({status: "bugged"});
        }
    }).end();
});

app.get("/disable/:config", function(req, res) {
    var config = req.params.config;

    var options = {
        host: docker.host,
        path: "/containers/logstash-" + config + "?force=true",
        port: docker.port,
        method: "DELETE"
    };

    http.request(options, function(response) {
        var statusCode = response.statusCode;
        var content = "";
        if (statusCode < 300) {
            res.json({status: "available"});
        } else {
            res.json({status: "bugged"});
        }
    }).end();
});

app.get("/read/:config", function(req, res) {
    var config = req.params.config;

    if (config.slice(-1) != "/")
        config = "/" + config;

    fs.readFile("/config/" + config, "utf-8", function(err, data) {
        if (err)
            console.error(err);

        res.send(data);
    })
});

app.listen(3000);