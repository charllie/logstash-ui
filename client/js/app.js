var app = angular.module('app', ['ngRoute', 'ngAnimate']);

app.config(['$routeProvider', function($routeProvider) {
	$routeProvider
		.when('/', {
			templateUrl: 'js/views/home.html',
			controller: 'ConfigurationsCtrl'
		})
		.when('/data', {
			templateUrl: 'js/views/files.html',
			controller: 'FilesCtrl',
			parent: '/data'
		})
		.when('/config', {
			templateUrl: 'js/views/files.html',
			controller: 'FilesCtrl',
			parent: '/config'
		})
		.otherwise({
			redirectTo: '/'
		});
}]);

app.controller('ConfigurationsCtrl', ['$scope', '$http', Configurations]);
app.controller('FilesCtrl', ['$scope', '$http', '$route', Files]);