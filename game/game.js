(function() {

    var app = angular.module("loups");

    app.controller('GameController', function (Loups, $scope, $rootScope)
    {
        console.log("GameController");
        if (Loups.checkLogin()) {
            $scope.messages = [];
	        Loups.bind($scope, 'messages', 'game/messages');

            $scope.addMessage = function(e) {
                if (e.keyCode != 13) return;
                $scope.messages.push({from: $rootScope.user.name || $scope.user.email, body: $scope.msg});
                $scope.msg = "";
            };
        }
    });

})();