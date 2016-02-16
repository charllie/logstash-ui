function Configurations($scope, $http) {

    var list = [];
    var status = {
        unknown: 'unknown',
        available: 'available',
        active: 'active',
        bugged: 'bugged'
    };

    function loadList() {

        $http.get('/list').then(function(success) {

            var data = success.data;

            list = [];
            for(var i in data) {
                list.push({
                    name: data[i],
                    class: 'basic loading',
                    icon: '',
                    status: status.unknown
                })
            }

            updateScope($scope);
        }, function(error) {
            // TODO
        });
    }

    loadList();

    $scope.getList = function() {
        return list;
    };

    $scope.activate = function(configuration) {
        if (configuration.status && configuration.status === status.available) {
            pending(configuration);
            $http.get('/activate' + configuration.name).then(function(success) {
                active(configuration);
            }, function(error) {
                bugged(configuration);
            });
        }
    };

    $scope.open = function(configuration) {
        $http.get('/read/' + configuration.name).then(function(data) {
            console.log(data);
        }, function(data) {
            // TODO
        });
    };

    $scope.disable = function(configuration) {
        if (configuration.status && configuration.status === status.active) {
            pending(configuration);
            $http.get('/disable/' + configuration.name).then(function(success) {
                available(configuration);
            }, function(error) {
                bugged(configuration);
            });
        }
    };

    $scope.reload = function(configuration) {
        if (configuration.status && configuration.status === status.bugged) {
            pending(configuration);
            $http.get('/activate' + configuration.name).then(function(success) {
                active(configuration);
            }, function(error) {
                bugged(configuration);
            });
        }
    };

    $scope.neitherActiveNorBugged = function(configuration) {
        return !(configuration.status === status.active || configuration.status === status.bugged);
    };

    function available(configuration) {
        configuration.class = 'green';
        configuration.icon = 'plus';
        configuration.status = status.available;
    }

    function active(configuration) {
        configuration.class = 'yellow';
        configuration.icon = 'minus';
        configuration.status = status.active;
    }

    function bugged(configuration) {
        configuration.class = 'orange';
        configuration.icon = 'warning';
        configuration.status = status.bugged;
    }

    function pending(configuration) {
        configuration.class = 'basic loading';
        configuration.icon = '';
    }

}