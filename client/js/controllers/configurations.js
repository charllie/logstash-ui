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
                var obj = {
                    name: data[i],
                    class: 'basic loading',
                    icon: '',
                    status: status.unknown
                };

                list.push(obj);

                $http.get('/status/' + data[i]).then(function(success) {
                    var successStatus = success.data.status;

                    switch (successStatus) {
                        case status.available:
                            available(obj);
                            break;

                        case status.active:
                            active(obj);
                            break;

                        default:
                            bugged(obj);
                            break;
                    }

                }, function(error) {
                    bugged(obj);
                });
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
            $http.get('/activate/' + configuration.name).then(function(success) {

                if (success.data.status && success.data.status === status.active)
                    active(configuration);
                else
                    bugged(configuration);
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
            $http.get('/activate/' + configuration.name).then(function(success) {
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
        updateScope($scope);
    }

    function active(configuration) {
        configuration.class = 'yellow';
        configuration.icon = 'minus';
        configuration.status = status.active;
        updateScope($scope);
    }

    function bugged(configuration) {
        configuration.class = 'orange';
        configuration.icon = 'warning';
        configuration.status = status.bugged;
        updateScope($scope);
    }

    function pending(configuration) {
        configuration.class = 'basic loading';
        configuration.icon = '';
        updateScope($scope);
    }

}