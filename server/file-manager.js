var fs = require('fs');

function ls(folder, success, error) {
	fs.readdir(folder, function (err, files) {
		if (err) {
			console.error(err);
			if (error)
				error();
		} else {
			if (success) {
				success(files);
			}
		}
	});
}

function lsDetails(folder, success, error) {
	var errorDeployed = false;
	fs.readdir(folder, function (err, list) {
		if (err) {
			console.error(err);
			if (error && !errorDeployed) {
				error();
				errorDeployed = true;
			}
		} else {

			if (success) {
				var details = {
					files: [],
					folders: []
				};

				var controller = {
					todo: list.length,
					done: 0
				};

				if (list.length > 0) {
					for (var i in list) {
						var item = list[i];
						var fold = folder;

						if (fold.slice(-1) == '/')
							fold = fold.substring(0, fold.length - 1);

						getStat(fold, item, details, controller, success);
					}
				} else if (list.length === 0) {
					success(details);
				}
			} else {
				console.error(err);
				if (error && !errorDeployed) {
					error();
					errorDeployed = true;
				}
			}
		}
	});
}

function getStat(folder, item, details, controller, callback) {
	fs.lstat(folder + '/' + item, function(err, stats) {
		controller.done += 1;

		if (!err) {
			if (stats.isFile()) {
				details.files.push(item);
			} else if (stats.isDirectory()) {
				details.folders.push(item);
			}
		}

		if (controller.done >= controller.todo) {
			callback(details);
		}
	});
}

function cat(file, encoding, callback) {
	fs.readFile(file, encoding, function (err, data) {
		if (err)
			console.error(err);
		else {
			if (callback)
				callback(data);
		}
	});
}

function rm(file, callback) {
	fs.unlink(file, function(err) {
		if (err)
			console.error(err);
		else {
			if (callback)
				callback();
		}
	});
}

module.exports = {
	ls: ls,
	lsDetails: lsDetails,
	cat: cat,
	rm: rm
};