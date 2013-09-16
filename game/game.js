(function () {

	var app = angular.module("LoupsGarous");


	app.controller('GameController', function (LG, lgCharacters, $scope, $rootScope, $timeout)
	{
		var chatView = $('#messages'),
			multitouch = (typeof window.orientation !== 'undefined');

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
			else if (previous === 'RUNNING' && status === 'STOPPED') {
				//console.log("QUIT ??");
				LG.quitGame();
			}
		}, true);


		$rootScope.$watch('game.time', function (value, old) {
			// night -> day
			if (value === 'N' && old === 'D') {
				console.log("Game time: ", value, " (old=", old, ")");
				$rootScope.me.player.voteFor = null;
			}
		}, true);

		var prevMessageCount = 0;
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
			if (! multitouch && messages.length !== prevMessageCount) {
				var el = document.getElementById("messages");
				$timeout(function () {
					el.scrollTop = el.scrollHeight;
				});
				prevMessageCount = messages.length;
			}
			return messages;
		};


		function resizeHandler () {
			var height = $(document).innerHeight() - chatView.offset().top - 80;
			chatView.css('max-height', height+'px');
			var el = chatView.get(0);
			el.scrollTop = el.scrollHeight;
		}
		if (! multitouch) {
			$(window).resize(resizeHandler);
			resizeHandler();
		}
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