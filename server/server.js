var express = require('express');
var config = require('./config.json');
var fs = require('fs');
var http = require('http');
var app = express();

var docker = config.docker;
var folders = config.folders;

function disable(config, success, error) {
	var options = {
		host: docker.host,
		path: '/containers/logstash-' + config + '?force=true',
		port: docker.port,
		method: 'DELETE'
	};

	http.request(options, function (response) {
		var statusCode = response.statusCode;
		if (statusCode < 300) {
			console.log('Config successfully disabled: ' + config);
			if (success)
				success();
		} else {
			console.log('Cannot disable the config: ' + config);
			if (error)
				error();
		}
	}).end();
}

function getList(success, error) {
	fs.readdir('/config', function (err, files) {
		if (err) {
			console.error(err);
			if (error)
				error();
		} else {
			if (success) {
				success(files.filter(function (file) {
					var suffix = '.conf';
					return file.substr(-suffix.length) === suffix;
				}));
			}
		}
	});
}


app.use(express.static('../client/'));

app.get('/list', function (req, res) {

	getList(function (files) {
		res.json(files);
	}, function () {
		res.status(400).send('Config folder not valid.');
	});

});

app.get('/status/:config', function (req, res) {
	var config = req.params.config;

	var options = {
		host: docker.host,
		path: '/containers/logstash-' + config + '/json',
		port: docker.port,
		method: 'GET'
	};

	http.request(options, function (response) {
		var statusCode = response.statusCode;
		var content = "";
		if (statusCode < 200 || statusCode > 299) {
			res.json({status: 'available'});
		} else {
			response.on('data', function (chunk) {
				content += chunk;
			});

			response.on('end', function () {
				var data = JSON.parse(content);
				if (data.State && data.State.Status && data.State.Status === 'running') {
					res.json({status: 'active'});
				} else {
					res.json({status: 'bugged'});
				}
			});
		}
	}).end();
});

app.get('/activate/:config', function (req, res) {
	var config = req.params.config;

	// Start the container
	var optionsStart = {
		host: docker.host,
		path: '/containers/logstash-' + config + '/start',
		port: docker.port,
		method: 'POST'
	};

	http.request(optionsStart, function (response) {
		var statusCodeStart = response.statusCode;
		if (statusCodeStart == 404) {
			console.log('No such container: ' + config);
			console.log('Creating now...');

			var data = JSON.stringify({
				Image: 'logstash:latest',
				HostConfig: {
					Binds: [folders.data + ':/data', folders.config + ':/config']
				},
				Cmd: ['logstash', '-w', '1', '-f', '/config/' + config]
			});

			// Create the container
			var options = {
				host: docker.host,
				path: '/containers/create?name=logstash-' + config,
				port: docker.port,
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Content-Length': data.length
				}
			};

			var request = http.request(options, function (r) {
				var statusCode = r.statusCode;

				if (statusCode < 200 || statusCode > 299) {
					console.log('Cannot create the container: ' + config);
					res.json({status: 'bugged'});
				} else {
					console.log('Container successfully created: ' + config);

					http.request(optionsStart, function (rr) {
						if (rr.statusCode == 204 || rr.statusCode == 304) {
							console.log('Starting the config: ' + config);
							res.json({status: 'active'});
						} else {
							console.log('Cannot start the config: ' + config);
							res.json({status: 'bugged'});
						}
					}).end();
				}
			});

			request.write(data);
			request.end();

		} else if (statusCodeStart == 204 || statusCodeStart == 304) {
			console.log('Starting the config: ' + config);
			res.json({status: 'active'});
		} else {
			console.log('Cannot start the config: ' + config);
			res.json({status: 'bugged'});
		}
	}).end();
});

app.get('/disable/:config', function (req, res) {
	var config = req.params.config;

	disable(config, function () {
		res.json({status: 'available'});
	}, function () {
		res.json({status: 'bugged'});
	});
});

app.get('/read/:config', function (req, res) {
	var config = req.params.config;

	if (config.slice(-1) != '/')
		config = '/' + config;

	fs.readFile('/config/' + config, 'utf-8', function (err, data) {
		if (err)
			console.error(err);
		else
			res.send(data);
	})
});

app.listen(3000);

process.on('SIGTERM', function () {

	getList(function (files) {
		var operation = {
			done: 0,
			todo: files.length
		};

		function upAndCheckAllDone() {

			operation.done += 1;
			console.log('Closing configurations: ' + operation.done + '/' + operation.todo);

			if (operation.done >= operation.todo) {
				process.exit();
			}
		}

		for (var i in files) {
			var config = files[i];
			disable(config, upAndCheckAllDone, upAndCheckAllDone);
		}
	});
});