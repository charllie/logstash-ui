function Files($scope, $http, $route) {
	var files = [];
	var folders = [];
	var parent = $route.current.$$route.parent;
	var subfolders = [];
	var pending = false;

	function open(folder, success, error) {
		if (!pending) {
			pending = true;
			updateScope($scope);
			$http.get('/volumes' + parent, folder).then(function (response) {
				if (success) {
					success(response);
				}
				pending = false;
				updateListing(response);
			}, function () {
				files = [];
				folders = [];
				subfolders = [];
				updateScope($scope);
				if (error)
					error();
				else
					showError();
			});
		}
	}

	open();

	$scope.isPending = function() {
		return pending;
	};

	$scope.getFiles = function() {
		return files;
	};

	$scope.getFolders = function() {
		return folders;
	};

	function pwd() {
		return parent + subfoldersToString();
	}

	function folderToString(folderArray) {
		var folder = '';
		for (var i in folderArray) {
			folder += '/' + folderArray[i];
		}
		return folder;
	}

	function subfoldersToString() {
		return folderToString(subfolders);
	}

	$scope.pwd = pwd;

	$scope.open = function(f) {
		var folder = subfoldersToString() + '/' + f;

		open({
			params: {
				subfolders: folder
			}
		}, function(response) {
			subfolders.push(f);
		});
	};

	$scope.isParent = isParent;

	$scope.back = function() {
		if (!isParent()) {
			var folderArray = subfolders.slice(0, -1);
			var folder = folderToString(folderArray);
			open({
				params: {
					subfolders: folder
				}
			}, function(response) {
				subfolders.pop();
			});
		}
	};

	function isParent() {
		return (_.isEmpty(subfolders));
	}

	function updateListing(response) {
		var items = response.data;
		files = items['files'];
		folders = items['folders'];
		updateScope($scope);
	}

	function showError() {
		// TODO
	}
}