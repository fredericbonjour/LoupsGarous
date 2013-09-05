(function () {

	var app = angular.module("LoupsGarous");


	app.controller('GameController', function (Loups, $scope, $rootScope) {
		console.log("GameController");
		if (Loups.checkLogin()) {
			$scope.game = {
				messages : [],
				players : []
			};
			Loups.bind($scope, 'game', 'game');

			$scope.addMessage = function () {
				$scope.game.messages.push({
					sender: $rootScope.user.id,
					body: $scope.msg,
					date: new Date().getTime()
				});
				$scope.msg = "";
			};

			$scope.joinGame = function () {
				// TODO Transactions!
				if (! $scope.game.players) {
					$scope.game.players = [];
				}
				$scope.game.players.push({
					'user'   : $rootScope.user.id,
					'status' : 'ALIVE'
				});
				$rootScope.user.hasJoined = true;
			};

			$scope.quitGame = function () {
				// TODO Transactions!
				var i;
				for (i=0 ; i<$scope.game.players.length ; i++) {
					if ($scope.game.players[i].user === $rootScope.user.id) {
						$scope.game.players.splice(i, 1);
						$rootScope.user.hasJoined = false;
						break;
					}
				}
			};
		}
	});


	app.controller('NewGameController', function (Loups, $scope) {

		// Bindings
		Loups.bind($scope, 'game', 'game');
		Loups.bind($scope, 'users', 'users');

		// Actions
		$scope.createGame = function () {
			$scope.game.status = 'WAITING';
			$scope.game.players = [];
		};

		$scope.prepareGame = function () {
			$scope.game.status = 'PREPARING';
		};

		$scope.cancelGame = function () {
			$scope.createGame();
		};

		$scope.stopGame = function () {
			$scope.game.status = 'STOPPED';
		};
	});

})();