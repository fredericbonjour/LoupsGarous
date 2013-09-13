(function () {

	var app = angular.module("LoupsGarous");


	app.controller('GameController', function (LG, lgCharacters, $scope, $rootScope)
	{
		console.log("GameController");

		$scope.addMessage = function () {
			LG.postMessage($scope.msg);
			$scope.msg = "";
		};

		$scope.joinGame = LG.joinGame;
		$scope.quitGame = LG.quitGame;

		$rootScope.$watch('game.status', function (status, previous) {
			console.log("GameController: game.status=", status, ", prev=", previous);

			if (previous === 'PREPARING' && status === 'WAITING') {
				LG.quitGame();
			}
			// Game has just started!
			else if (status === 'RUNNING') {
				console.log("GameController: game.status=RUNNING, joinRef=", $rootScope.user.joinRef);
				if ($rootScope.user.joinRef) {
					LG.initUserPlayer();
				}
				else {
					console.log("Il semblerait que vous ne soyez pas dans la partie :(");
				}
			}
			else if (previous === 'RUNNING' && status !== previous) {
				console.log("QUIT ??");
				// LG.quitGame();
			}
		}, true);


		$rootScope.$watch('game.time', function (value, old) {
			// night -> day
			if (value === 'N' && old === 'D') {
				console.log("Game time: ", value, " (old=", old, ")");
				$rootScope.me.player.voteFor = null;
			}
		}, true);

/*
		$rootScope.$watch('game.phase', function (phase) {
			if (phase) {
				console.log("game phase=", phase);
				if (phase === $rootScope.me.character.phase) {

				}
			}
		}, true);
*/


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


	app.controller('NewGameController', function (LG, $scope, $rootScope)
	{
		$scope.gameData = {};

		// Actions
		$scope.createGame = function () {
			$rootScope.game.status = 'WAITING';
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