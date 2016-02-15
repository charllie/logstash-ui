function updateScope(scope) {
    _.defer(function() {
        scope.$apply();
    });
}