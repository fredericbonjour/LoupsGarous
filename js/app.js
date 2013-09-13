(function (Firebase) {

	var app = angular.module("LoupsGarous", ["ngRoute", "firebase"]),
		firebaseRef = new Firebase(LG_FIREBASE_URL),
		NIGHT_DURATION = 10;


	app.config(function($routeProvider)
	{
		$routeProvider
			.when('/login', { templateUrl: 'user/login.html' })
			.when('/profile', { templateUrl: 'user/profile.html', authRequired: true })
			.when('/game', { templateUrl: 'game/game.html', authRequired: true })
			.when('/admin', { templateUrl: 'game/admin.html', authRequired: true })
			.otherwise({ redirectTo: '/game' });
	});


	app.run(function (angularFire, angularFireAuth, $rootScope) {
		$rootScope.$on('angularFireAuth:login', function (event, user) {
			console.log("angularFireAuth:login: user=", user);
			angularFire(firebaseRef.child('users/' + user.id), $rootScope, 'userInfo');
		});

		$rootScope.$watch('userInfo', function (info) {
			console.log("watch userInfo: ", info);
			if (info) {
				angular.extend($rootScope.user, info);
			}
		}, true);

		angularFireAuth.initialize(firebaseRef, {
			'scope' : $rootScope,
			'path': '/login',
			'name' : 'user'
		});
	});


	/**
	 * Smileys service that translates smiley codes into `<i class="icon-smiley-"></i>`.
	 * (uses IcoMoon font, see in `css/smileys` directory)
	 */
	app.service('lgSmileys', function () {
		var smileys = {
			'>:\\)' : 'evil',
			'<3' : 'heart',
			':\\-?D' : 'happy',
			'xD' : 'happy',
			':\\-?\\)' : 'smiley',
			':\\-?P' : 'tongue',
			':\\-?\\(' : 'sad',
			';\\-?\\)' : 'wink',
			'8\\-?[\\)D]' : 'cool',
			'><' : 'angry',
			':\\-?\\$' : 'wondering',
			':\\-?\\|' : 'neutral',
			':\\-?\/' : 'confused',
			':\\-?O' : 'shocked'
		};
		return {
			parse : function (input) {
				angular.forEach(smileys, function (name, symbol) {
					var regexp = new RegExp(symbol, "ig");
					input = input.replace(regexp, ':' + name + ':');
				});
				return input.replace(/:([a-z]+):/g, '<i class="icon-smiley-$1"></i>');
			}
		};
	});


	/**
	 * Main service.
	 */
	app.service('LG', function (angularFire, angularFireAuth, angularFireCollection, $rootScope, $location, $q, $timeout, lgCharacters) {

		// Bindings
		var playersReadyDefered = $q.defer();
		bind($rootScope, 'users', 'users');
		bind($rootScope, 'game', 'game');

		$rootScope.$watchCollection('players', function (players) {
			if (players) {
				playersReadyDefered.resolve(players);
			}
		});
		$rootScope.players = bindCollection('game/players');


		//
		// Firebase binding methods
		//

		function bind ($scope, name, path) {
			var ref = path ? firebaseRef.child(path) : firebaseRef;
			return angularFire(ref, $scope, name);
		}

		function bindUser ($scope, name) {
			return bind($scope, name, 'users/' + $rootScope.user.id);
		}

		function bindCollection (path, callback) {
			return angularFireCollection(firebaseRef.child(path), callback);
		}

		//
		// Login and logout
		//

		function login (user, pass) {
			return angularFireAuth.login('password', {
				email : user,
				password : pass
			});
		}

		function logout () {
			angularFireAuth.logout();
			$location.path('/login');
		}

		//
		// Game process methods
		//

		function createGame () {
			$rootScope.game.status = 'WAITING';
		}

		function joinGame () {

			function doJoin () {
				var joinRef = $rootScope.players.add({
					'user'   : $rootScope.user.id,
					'status' : 'ALIVE',
					'voteFor': null
				});
				console.log("Join id: ", joinRef.name());
				$rootScope.userInfo.joinRef = joinRef.name();
			}

			playersReadyDefered.promise.then(doJoin);
		}

		function quitGame () {
			delete $rootScope.userInfo.joinRef;
		}

		function prepareGame () {
			$rootScope.game.status = 'PREPARING';
		}

		function cancelGame () {
			createGame();
		}

		function stopGame () {
			$rootScope.game.status = 'STOPPED';
			$timeout(function () {
				new Firebase(LG_FIREBASE_URL + 'game/players').remove();
			});
		}

		function assignCharacters (selectedChars) {
			// Create flat list of chars
			var i, j,
				chars = selectedChars.chars,
				list = [];

			for (i=0 ; i<chars.length ; i++) {
				for (j=0 ; j<chars[i].count ; j++) {
					list.push(chars[i].id);
				}
			}

			angular.forEach($rootScope.game.players, function (player) {
				var r = Math.floor(Math.random()*list.length);
				player.role = list[r];
				console.log("Assigning ", player.role, " to ", player);
				list.splice(r, 1);
			});
		}

		function beginGame (selectedChars) {
			assignCharacters(selectedChars);
			$rootScope.game.status = 'RUNNING';
			$rootScope.game.time = 'N';
			$location.path('/game');
		}

		function initUserPlayer () {
			playersReadyDefered.promise.then(function () {
				var player = $rootScope.players.getByName($rootScope.user.joinRef);
				$rootScope.me = {
					'char'   : angular.copy(lgCharacters.characterById(player.role)),
					'player' : player
				};
			});
		}

		//
		// Night and day
		//

		function beginDay () {
			$rootScope.game.time = 'D';
		}

		function beginNight () {
			resetVotes();
			$rootScope.game.time = 'N';
		}


		function resetVotes () {
			angular.forEach($rootScope.game.players, function (p) {
				p.voteFor = null;
			});
		}


		function isNight () {
			return $rootScope.game && $rootScope.game.time === 'N';
		}
		$rootScope.isNight = isNight;


		function isDay () {
			return ! isNight();
		}
		$rootScope.isDay = isDay;


		function isGameMaster () {
			return $rootScope.user && $rootScope.game && $rootScope.game.master == $rootScope.user.id;
		}
		$rootScope.isGameMaster = isGameMaster;


		function isDead (player) {
			return player && player.status === 'DEAD';
		}
		$rootScope.isDead = isDead;


		function isAlive (player) {
			return player && player.status === 'ALIVE';
		}
		$rootScope.isAlive = isAlive;


		function iAmDead() {
			return $rootScope.me && isDead($rootScope.me.player);
		}
		$rootScope.iAmDead = iAmDead;


		function iAmAlive() {
			return $rootScope.me && isAlive($rootScope.me.player);
		}
		$rootScope.iAmAlive = iAmAlive;



		$rootScope.$on('LG:NightIsOver', function () {
			console.log("Nuit terminée !");
			// Only the game master's client will end the night.
			if (isGameMaster()) {
				console.log("Maître du jeu -> terminer la nuit...");

				var votesByPlayer = {};
				angular.forEach($rootScope.players, function (p) {
					if (p.voteFor) {
						votesByPlayer[p.voteFor] = (votesByPlayer[p.voteFor] || 0) + 1;
					}
				});
				console.log(votesByPlayer);

				var maxVotes = 0, loosers = [], looser = null;
				// Get max value for votes
				angular.forEach(votesByPlayer, function (count) {
					maxVotes = Math.max(maxVotes, count);
				});
				if (maxVotes > 0) {
					// Get which players have this vote count
					angular.forEach(votesByPlayer, function (count, playerId) {
						if (count === maxVotes) {
							loosers.push(playerId);
						}
					});
				}
				console.log("loosers of the night: ", loosers);

				if (loosers.length === 1) {
					looser = loosers[0];
				}
				// Multiple loosers
				else if (loosers.length > 1) {
					looser = loosers[Math.floor(Math.random()*loosers.length)];
				}

				if (! looser) {
					console.log("Aucun perdant !");
				}
				else {
					killPlayer(looser);
				}

			}
		});


		function myTeamIs(team) {
			return $rootScope.me && $rootScope.me.char.team === team;
		}
		$rootScope.myTeamIs = myTeamIs;


		function killPlayer (pId) {
			console.log("killing player ", pId);
			var looser = $rootScope.players.getByName(pId);
			looser.status = 'DEAD';
			$rootScope.players.update(looser);

			if ($rootScope.me.player.$id === pId) {
				console.log("Hey, it's me :(");
				$rootScope.me.player.status = 'DEAD';
			}
		}






		//
		// Public API
		//

		return {
			user : $rootScope.user,

			bind : bind,
			bindUser : bindUser,
			bindCollection : bindCollection,

			// Login/logout
			login : login,
			logout : logout,

			// Game methods
			createGame : createGame,
			joinGame : joinGame,
			quitGame : quitGame,
			prepareGame : prepareGame,
			cancelGame : cancelGame,
			stopGame : stopGame,
			beginGame : beginGame,
			initUserPlayer : initUserPlayer,

			// Night and day
			beginDay : beginDay,
			beginNight : beginNight,
			isNight : isNight,
			isDay : isDay,

			isDead : isDead,
			isAlive : isAlive,

			iAmDead : iAmDead,
			iAmAlive : iAmAlive,
			myTeamIs : myTeamIs
		};

	});


	app.controller('NavBarController', function (LG, $scope, $rootScope) {
		$rootScope.$watch('user', function (user, old) {
			if (user) {
				LG.bindUser($scope, 'userInfo');
			}
		}, true);

		$scope.logout = function () {
			LG.logout();
		};
	});


	app.filter('remainingTime', function () {
		return function (seconds) {
			if (! seconds) {
				seconds = 0;
			}
			var min = 0;
			if (seconds > 59) {
				min = Math.floor(seconds / 60);
				seconds = seconds % 60;
			}
			if (seconds < 10) {
				return min + ':0' + seconds;
			}
			return min + ':' + seconds;
		};
	})


})(Firebase);