(function () {

	var app = angular.module("LoupsGarous");


	app.controller('GameController', function (Loups, $scope, $rootScope) {
		console.log("GameController");
		if (Loups.checkLogin()) {
			$scope.messages = [];
			Loups.bind($scope, 'messages', 'game/messages');

			$scope.addMessage = function () {
				$scope.messages.push({
					sender: $rootScope.user.id,
					body: $scope.msg,
					date: new Date().getTime()
				});
				$scope.msg = "";
			};
		}
	});


	app.controller('NewGameController', function (Loups, $scope) {

	});

})();