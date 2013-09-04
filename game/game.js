(function () {

    var app = angular.module("LoupsGarous");

    app.controller('GameController', function (Loups, $scope, $rootScope)
    {
        console.log("GameController");
        if (Loups.checkLogin()) {
            $scope.messages = [];
	        Loups.bind($scope, 'messages', 'game/messages');

            $scope.addMessage = function(e) {
                if (e.keyCode != 13) return;
                $scope.messages.push({
	                sender : {'id': $rootScope.user.id, 'name': $rootScope.user.name || $scope.user.email},
	                body   : $scope.msg,
	                date   : new Date().getTime()
                });
                $scope.msg = "";
            };
        }
    });

})();