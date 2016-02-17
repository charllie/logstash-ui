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
        else {
            res.json(files.filter(function (file) {
                var suffix = ".conf";
                return file.substr(-suffix.length) === suffix;
            }));
        }
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

app.get("/activate/:config", function(req, res) {
    var config = req.params.config;

    // Start the container
    var optionsStart = {
        host: docker.host,
        path: "/containers/logstash-" + config + "/start",
        port: docker.port,
        method: "POST"
    };

    http.request(optionsStart, function(response) {
        var statusCodeStart = response.statusCode;
        if (statusCodeStart == 404) {
            console.log("No such container: " + config);
            console.log("Creating now...");

            var data = JSON.stringify({
                Image: "logstash:latest",
                HostConfig: {
                    Binds: [folders.data + ":/data", folders.config + ":/config"]
                },
                Cmd: ["logstash", "-w", "1", "-f", "/config/" + config]
            });

            // Create the container
            var options = {
                host: docker.host,
                path: "/containers/create?name=logstash-" + config,
                port: docker.port,
                method: "POST",
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': data.length
                }
            };

            var request = http.request(options, function(r) {
                var statusCode = r.statusCode;

                if (statusCode < 200 || statusCode > 299) {
                    console.log("Cannot create the container: " + config);
                    res.json({status: "bugged"});
                } else {
                    console.log("Container successfully created: " + config);

                    http.request(optionsStart, function(rr) {
                        if (rr.statusCode == 204 || rr.statusCode == 304) {
                            console.log("Starting the config: " + config);
                            res.json({status: "active"});
                        } else {
                            console.log("Cannot start the config: " + config);
                            res.json({status: "bugged"});
                        }
                    }).end();
                }
            });

            request.write(data);
            request.end();

        } else if (statusCodeStart == 204 || statusCodeStart == 304) {
            console.log("Starting the config: " + config);
            res.json({status: "active"});
        } else {
            console.log("Cannot start the config: " + config);
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
        if (statusCode < 300) {
            console.log("Config successfully disabled:" + config);
            res.json({status: "available"});
        } else {
            console.log("Cannot disable the config:" + config);
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
        else
            res.send(data);
    })
});

app.listen(3000);