(function () {

	var app = angular.module("LoupsGarous");


	app.controller('GameController', function (Loups, $scope, $rootScope) {
		console.log("GameController");
		if (Loups.checkLogin()) {

			// Bindings
			$scope.game = {};
			Loups.bind($scope, 'game', 'game');
			$scope.messages = Loups.bindCollection('game/messages');
			$scope.players = Loups.bindCollection('game/players');

			$scope.addMessage = function () {
				$scope.messages.add({
					sender: $rootScope.user.id,
					body: $scope.msg,
					date: new Date().getTime()
				});
				$scope.msg = "";
			};

			$scope.joinGame = function () {
				var joinRef = $scope.players.add({
					'user'   : $rootScope.user.id,
					'status' : 'ALIVE'
				});
				console.log("Join id: ", joinRef.name());
				$rootScope.userInfo.joinRef = joinRef.name();
			};

			$scope.quitGame = function () {
				$scope.players.remove($rootScope.userInfo.joinRef);
				delete $rootScope.userInfo.joinRef;
			};

			$scope.$watch('game.status', function (status, previous) {
				if (previous === 'PREPARING' && status === 'WAITING') {
					$scope.quitGame();
				}
			}, true);
		}
	});


	app.controller('NewGameController', function (Loups, $scope) {

		// Bindings
		Loups.bind($scope, 'game', 'game');
		Loups.bind($scope, 'users', 'users');
		//$scope.players = Loups.bindCollection('game/players');

		// Actions
		$scope.createGame = function () {
			$scope.game.status = 'WAITING';
		};

		$scope.countPlayers = function () {
			if ($scope.game && $scope.game.players) {
				var count = 0;
				angular.forEach($scope.game.players, function () {
					count++;
				});
				console.log("players=", count);
				return count;
			}
			return 0;
		};

		$scope.$watch('game.players', function (players) {
			if (players) {
				var count = 0;
				angular.forEach(players, function () {
					count++;
				});
				console.log("players=", count);
				$scope.playersCount = count;
			}
		}, true);

		$scope.prepareGame = function () {
			$scope.game.status = 'PREPARING';
		};

		$scope.cancelGame = function () {
			//$scope.players = {};
			$scope.createGame();
		};

		$scope.stopGame = function () {
			$scope.game.status = 'STOPPED';
		};
	});

})();