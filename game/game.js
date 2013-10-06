(function () {

	var app = angular.module("LoupsGarous");


	app.controller('GameController', function (LG, lgCharacters, lgPhase, $scope, $rootScope, $timeout, $log)
	{
		$scope.joinGame = LG.joinGame;
		$scope.quitGame = LG.quitGame;

		// Game status changes

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
			else if (previous === 'RUNNING' && status === 'STOPPED') {
				//console.log("QUIT ??");
				LG.quitGame();
			}
		}, true);


		$rootScope.$watch('game.phase', function (value, old)
		{
			if (value === lgPhase.VILLAGEOIS && value !== old) {
				LG.playSound('coq');
			}
			else if (value === lgPhase.LOUPS && value !== old) {
				LG.playSound('loup');
			}

			// FIXME
			if ($rootScope.me) {
				$rootScope.me.player.voteFor = null;
			}
		}, true);


		$rootScope.$watch('game.phase', function (phase, old) {
			$log.info("La phase du jeu a changé : ", phase);
		}, true);

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

		$scope.beginGame = function () {
			LG.beginGame($scope.gameData.selectedChars);
		};
	});

})();