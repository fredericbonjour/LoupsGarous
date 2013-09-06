(function () {

	var app = angular.module("LoupsGarous");


	app.controller('GameController', function (LG, $scope, $rootScope) {
		console.log("GameController");

		// Bindings
		$scope.game = {};
		LG.bind($scope, 'game', 'game');
		$scope.messages = LG.bindCollection('game/messages');
		$scope.players = LG.bindCollection('game/players');

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
			else if (status === 'RUNNING') {
				console.log("game started");
				console.log("joinRef=", $rootScope.user.joinRef);
				var player = $scope.players.getByName($rootScope.user.joinRef);
				$scope.me = LG.characterById(player.role);
			}
		}, true);

	});


	app.controller('NewGameController', function (LG, $scope) {

		// Bindings
		LG.bind($scope, 'game', 'game');
		LG.bind($scope, 'users', 'users');

		$scope.gameData = {};

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

		$scope.prepareGame = function () {
			$scope.game.status = 'PREPARING';
		};

		$scope.cancelGame = function () {
			$scope.createGame();
		};

		$scope.stopGame = function () {
			$scope.game.status = 'STOPPED';
		};

		function assignCharacters () {
			console.log($scope.gameData.selectedChars);
			console.log($scope.game.players);

			// Create flat list of chars
			var i, j,
				chars = $scope.gameData.selectedChars.chars,
				list = [];

			for (i=0 ; i<chars.length ; i++) {
				for (j=0 ; j<chars[i].count ; j++) {
					list.push(chars[i].id);
				}
			}

			angular.forEach($scope.game.players, function (player) {
				var r = Math.floor(Math.random()*list.length);
				player.role = list[r];
				console.log("Assigning ", player.role, " to ", player);
				list.splice(r, 1);
			});
		}

		$scope.beginGame = function () {
			assignCharacters();
			$scope.game.status = 'RUNNING';
		};
	});

})();