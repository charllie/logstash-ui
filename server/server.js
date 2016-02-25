// External Librairies
var express = require('express');
var multer = require('multer');
var http = require('http');
var Docker = require('dockerode');

// Local librairies
var fm = require('./file-manager.js');

// Configurations
var config = require('./config.json');

// Initializations
var app = express();
var upload = multer({ dest: '/data' });
var docker = new Docker(config.docker);
var folders = config.folders;

app.use(express.static('../client/'));

// Docker manipulations
function disable(config, success, error) {

	var container = docker.getContainer('logstash-' + config);

	if (container) {
		container.remove({
			force: true
		}, function (err, data) {
			if (err) {
				if (error)
					error();
			} else {
				if (success)
					success();
			}
		});
	}
}

app.get('/configs', function(req, res) {

	getList(function (files) {
		res.json(files);
	}, function () {
		res.status(400).send('Config folder not valid.');
	});

});

app.get('/configs/:config/status', function(req, res) {
	var config = req.params.config;
	var container = docker.getContainer('logstash-' + config);
	container.inspect(function(err, data) {
		if (err)
			res.json({status: 'available'});
		else {
			if (data.State && data.State.Status && data.State.Status === 'running') {
				res.json({status: 'active'});
			} else {
				res.json({status: 'bugged'});
			}
		}
	});
});

app.get('/configs/:config/logs', function(req, res) {
	var config = req.params.config;
	var tail = req.query.tail;

	if (parseInt(tail)) {
		tail = parseInt(tail);
	} else if (tail != 'all') {
		tail = 100;
	}

	var timestamps = (req.query.timestamps) ? true : false;
	var container = docker.getContainer('logstash-' + config);
	container.logs({
		stdout: true,
		stderr: true,
		timestamps: timestamps,
		tail: tail
	}, function(err, message) {
		if (err) {
			//res.statusCode(err.statusCode).end();
		} else {
			var data = '';
			message.on('data', function(chunk) {
				data += chunk.toString();
			});

			message.on('end', function() {
				res.json({
					data: data
						.replace(new RegExp('\r?\n','g'), '<br>')
						.replace(/[^A-Za-z 0-9 \.,\?""!@#\$%\^&\*\(\)-_=\+;:<>\/\\\|\}\{\[\]`~]*/g, '')
				});
			})
		}
	});
});

app.post('/configs/:config', function(req, res) {
	var config = req.params.config;
	var container = docker.getContainer('logstash-' + config);
	container.start(function(err, data) {
		if (err) {
			var statusCode = err.statusCode;

			if (statusCode == 404) {
				console.log('No such container: ' + config);
				console.log('Creating now...');

				docker.createContainer({
					Image: 'charllie/logstash:latest',
					HostConfig: {
						Binds: [folders.data + ':/data', folders.config + ':/config']
					},
					Cmd: ['-f', '/config/' + config],
					name: 'logstash-' + config
				}, function(err, c) {
					if (err) {
						console.log('Cannot create the container: ' + config);
						res.json({status: 'bugged'});
					} else {
						c.start(function(err, data) {
							if (err) {
								console.log('Cannot start the config: ' + config);
								res.json({status: 'bugged'});
							} else {
								console.log('Starting the config: ' + config);
								res.json({status: 'active'});
							}
						});
					}
				});

			} else {
				console.log('Cannot start the config: ' + config);
				res.json({status: 'bugged'});
			}

		} else {
			console.log('Starting the config: ' + config);
			res.json({status: 'active'});
		}
	});
});

app.delete('/configs/:config', function(req, res) {
	var config = req.params.config;

	disable(config, function () {
		res.json({status: 'available'});
	}, function () {
		res.json({status: 'bugged'});
	});
});

// Volume manipulations
function getList(success, error) {
	fm.ls('/config', function(files) {
		success(files.filter(function (file) {
			var suffix = '.conf';
			return file.substr(-suffix.length) === suffix;
		}));
	}, error);
}

function ls(configOrData, req, res) {
	var subfolders = (req.query.subfolders) ? req.query.subfolders : '';
	var forbidden = false;

	var subfoldersArray = subfolders.split('/');

	for (var i in subfoldersArray) {
		if (subfoldersArray[i] === '..') {
			forbidden = true;
			break;
		}
	}

	if (!forbidden) {
		var folder = configOrData + subfolders;

		fm.lsDetails(folder, function (files) {
			res.send(files);
		}, function () {
			res.status(404).end();
		});
	} else {
		res.status(403).end();
	}
}

app.get('/volumes/data', function(req, res) {
	ls('/data', req, res);
});

app.get('/volumes/config', function(req, res) {
	ls('/config', req, res);
});

app.post('/upload', upload.single('file'), function(req, res, next) {
	return res.status(200).end();
});

// To conclude
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