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
            /* TODO */
            configuration.class = 'yellow';
            configuration.icon = 'minus';
            configuration.status = status.active;
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
            /* TODO */
            configuration.class = 'green';
            configuration.icon = 'plus';
            configuration.status = status.available;
        }
    };

    $scope.reload = function(configuration) {
        if (configuration.status && configuration.status === status.bugged) {
            /* TODO */
        }
    };

    $scope.neitherActiveNorBugged = function(configuration) {
        return !(configuration.status === status.active || configuration.status === status.bugged);
    };

}