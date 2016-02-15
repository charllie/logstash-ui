var app = angular.module('app', []);

app.controller('ConfigurationsCtrl', ['$scope', '$http', Configurations]);
app.controller('ContainersCtrl', ['$scope', Containers]);