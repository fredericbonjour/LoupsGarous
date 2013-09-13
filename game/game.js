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
				date: new Date().getTime(),
				time: $rootScope.game.time,
				team: $scope.me ? $scope.me.char.team : '',
				dead: LG.isDead($scope.me.player)
			});
			$scope.msg = "";
		};

		$scope.joinGame = LG.joinGame;
		$scope.quitGame = LG.quitGame;

		$rootScope.$watch('game.status', function (status, previous) {
			if (previous === 'PREPARING' && status === 'WAITING') {
				LG.quitGame();
			}
			else if (status === 'RUNNING') {
				if ($rootScope.user.joinRef) {
					LG.initUserPlayer();
				}
				else {
					console.log("Il semblerait que vous ne soyez pas dans la partie :(");
				}

			}
			else if (previous === 'RUNNING') {
				LG.quitGame();
			}
		}, true);


		$rootScope.$watch('game.time', function (value, old) {
			if (value === 'N' && old === 'D') {
				console.log("Game time: ", value, " (old=", old, ")");
				$rootScope.me.player.voteFor = null;
			}
		}, true);

		$scope.availableMessages = function () {
			var messages = [];
			if ($scope.game && $scope.game.messages) {
				angular.forEach($scope.game.messages, function (msg) {
					if (LG.iAmDead()) {
						messages.push(msg);
					}
					else if (! msg.dead && (!msg.time || msg.time === 'D' || ($rootScope.me && msg.team === $rootScope.me.team))) {
						messages.push(msg);
					}
				});
			}
			return messages;
		};

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
		$scope.prepareGame = LG.prepareGame;
		$scope.cancelGame = LG.cancelGame;
		$scope.stopGame = LG.stopGame;

		$scope.countPlayers = function () {
			if ($scope.game && $scope.game.players) {
				var count = 0;
				angular.forEach($scope.game.players, function () {
					count++;
				});
				return count;
			}
			return 0;
		};

		$scope.beginGame = function () {
			LG.beginGame($scope.gameData.selectedChars);
		};
	});

})();