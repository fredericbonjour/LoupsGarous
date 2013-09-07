(function () {

	var app = angular.module("LoupsGarous");


	app.controller('GameController', function (LG, lgCharacters, $scope, $rootScope) {
		console.log("GameController");

		// Bindings
		$scope.messages = LG.bindCollection('game/messages');

		$scope.addMessage = function () {
			$scope.messages.add({
				sender: $rootScope.user.id,
				body: $scope.msg,
				date: new Date().getTime()
			});
			$scope.msg = "";
		};

		$scope.joinGame = LG.joinGame;

		$scope.quitGame = LG.quitGame;

		$rootScope.$watch('game.status', function (status, previous) {
			console.log("game.status=", status);
			if (previous === 'PREPARING' && status === 'WAITING') {
				LG.quitGame();
			}
			else if (status === 'RUNNING') {
				console.log("game started");
				console.log("joinRef=", $rootScope.user.joinRef);
				var player = $rootScope.game.players[$rootScope.user.joinRef];
				$scope.me = lgCharacters.characterById(player.role);
			}
		}, true);
	});


	app.controller('NewGameController', function (LG, $scope, $rootScope, $location, $timeout) {


		$scope.gameData = {};

		// Actions
		$scope.createGame = function () {
			$rootScope.players = LG.bindCollection('game/players', function () {
				$rootScope.game.status = 'WAITING';
			});
		};

		$scope.joinGame = LG.joinGame;

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
			$rootScope.game.status = 'PREPARING';
		};

		$scope.prepareGame = function () {
			$rootScope.game.status = 'PREPARING';
		};

		$scope.cancelGame = function () {
			$scope.createGame();
		};

		$scope.stopGame = function () {
			$rootScope.game.status = 'STOPPED';
			$timeout(function () {
				new Firebase(LG_FIREBASE_URL + 'game/players').remove();
			});
		};

		function assignCharacters () {
			console.log($scope.gameData.selectedChars);

			// Create flat list of chars
			var i, j,
				chars = $scope.gameData.selectedChars.chars,
				list = [];

			for (i=0 ; i<chars.length ; i++) {
				for (j=0 ; j<chars[i].count ; j++) {
					list.push(chars[i].id);
				}
			}

			angular.forEach($rootScope.game.players, function (player) {
				var r = Math.floor(Math.random()*list.length);
				player.role = list[r];
				//$rootScope.players.update(player);
				console.log("Assigning ", player.role, " to ", player);
				list.splice(r, 1);
			});
		}

		$scope.beginGame = function () {
			assignCharacters();
			$rootScope.game.status = 'RUNNING';
			$location.path('/game');
		};
	});

})();