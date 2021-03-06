function Configurations($scope, $http) {

	var list = [];
	var status = {
		unknown: 'unknown',
		available: 'available',
		active: 'active',
		bugged: 'bugged'
	};
	var logs = {
		printed: false,
		configuration: null
	};
	var logstash = {
		interval: null,
		loaded: false,
		header: 'Just one second',
		color: 'info',
		icon: 'notched circle loading',
		message: 'Pulling Logstash image...'
	};

	function loadList() {

		$http.get('/configs').then(function(success) {

			var data = success.data;

			list = [];
			for (var i in data) {
				var name = data[i];
				var obj = {
					name: data[i],
					class: 'basic loading',
					icon: '',
					status: status.unknown
				};

				list.push(obj);

				getStatus(obj);
			}

			updateScope($scope);
		}, function(error) {
			// TODO
		});
	}

	function getImageStatus() {
		$http.get('/status').then(function(success) {
			var status = success.data.status;

			switch(status) {
				case 'done':
				if (logstash.interval) {
					clearInterval(logstash.interval);
					setTimeout(function() {
						logstash.loaded = true;
						updateScope($scope);
					}, 3000);
				} else {
					logstash.loaded = true;
					updateScope($scope);
				}

				logstash.header = 'Done';
				logstash.color = 'success';
				logstash.message = 'You can now load your Logstash configurations';
				logstash.icon = 'checkmark';
				updateScope($scope);
				break;

				default:
				if (!logstash.interval) {
					logstash.interval = setInterval(getImageStatus, 2000);
				}
				break;
			}
		}, function(error) {
			logstash.message = 'Please check your internet connection';
			logstash.header = 'Cannot pull Logstash image';
			logstash.color = 'error';
			logstash.icon = 'remove';
			updateScope($scope);
		});
	}

	loadList();
	getImageStatus();

	$scope.getList = function() {
		return list;
	};

	$scope.activate = function(configuration) {
		if (configuration.status && configuration.status === status.available) {
			pending(configuration);
			$http.post('/configs/' + configuration.name).then(function(success) {

				if (success.data.status && success.data.status === status.active)
					active(configuration);
				else
					bugged(configuration);
			}, function(error) {
				bugged(configuration);
			});
		}
	};

	$scope.getLogstashHeader = function() {
		return logstash.header;
	};

	$scope.getLogstashColor = function() {
		return logstash.color;
	};

	$scope.getLogstashIcon = function() {
		return logstash.icon;
	};

	$scope.getLogstashMessage = function() {
		return logstash.message;
	};

	$scope.disable = function(configuration) {
		if (configuration.status && configuration.status === status.active) {
			pending(configuration);
			$http.delete('/configs/' + configuration.name).then(function(success) {
				if (success.data.status && success.data.status === status.available)
					available(configuration);
				else
					bugged(configuration);
			}, function(error) {
				bugged(configuration);
			});
		}
	};

	$scope.reload = function(configuration) {
		if (configuration.status && configuration.status === status.bugged) {
			pending(configuration);
			$http.post('/configs/' + configuration.name).then(function(success) {
				active(configuration);
			}, function(error) {
				bugged(configuration);
			});
		}
	};

	$scope.closeLogs = closeLogs;

	$scope.neitherActiveNorBugged = function(configuration) {
		return !(configuration.status === status.active || configuration.status === status.bugged);
	};

	$scope.getLogs = function(configuration) {
		$http.get('/configs/' + configuration.name + '/logs').then(function(success) {
			logs.printed = true;
			logs.configuration = configuration.name;
			updateScope($scope);
			document.getElementById("logs").innerHTML = success.data.data;
		}, function(error) {
			// TODO
		});
	};

	$scope.areLogsPrinted = function() {
		return logs.printed;
	};

	$scope.getLogsConfiguration = function() {
		return logs.configuration;
	};

	$scope.isLogstashLoaded = function() {
		return logstash.loaded;
	};

	$scope.getLogstashMessage = function() {
		return logstash.message;
	};

	function getStatus(configuration) {
		$http.get('/configs/' + configuration.name + '/status').then(function(success) {

			var successStatus = success.data.status;

			switch(successStatus) {
				case status.available:
					available(configuration);
					break;

				case status.active:
					active(configuration);
					break;

				default:
					bugged(configuration);
					break;
			}

		}, function(error) {
			bugged(configuration);
		});
	}

	function available(configuration) {
		configuration.class = 'green';
		configuration.icon = 'plus';
		configuration.status = status.available;
		updateScope($scope);
	}

	function active(configuration) {
		configuration.class = 'orange';
		configuration.icon = 'minus';
		configuration.status = status.active;
		updateScope($scope);
	}

	function bugged(configuration) {
		configuration.class = 'red';
		configuration.icon = 'warning';
		configuration.status = status.bugged;
		updateScope($scope);
	}

	function pending(configuration) {
		configuration.class = 'basic loading';
		configuration.icon = '';
		updateScope($scope);
	}

	function closeLogs() {
		logs.printed = false;
		updateScope($scope);
	}

}