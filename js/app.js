(function (Firebase) {

	var app = angular.module("LoupsGarous", ["ngRoute", "firebase"]),
		firebaseRef = new Firebase(LG_FIREBASE_URL),
		everythingReady;

	app.constant('NIGHT_DURATION', 15);


	/**
	 * Initialization code:
	 * - user login (auto or not)
	 * - load game objects from Firebase server
	 * The 'global everythingReady' deferred is resolved when everything is ready.
	 */
	app.run(function (angularFire, angularFireCollection, angularFireAuth, $rootScope, $q) {
		console.log("run");
		everythingReady = $q.defer();

		//
		// Init user
		//

		var gameObjectsLoaded = false;
		$rootScope.$on('angularFireAuth:login', function (event, user) {
			console.log("angularFireAuth:login: user=", user);

			$rootScope.$watch('userInfo', function (info, old) {
				if (info && info !== old) {
					console.log("$watch(userInfo): userInfo=", info);
					angular.extend($rootScope.user, info);
					if (! gameObjectsLoaded) {
						gameObjectsLoaded = true;
						loadGameObjects().then(function () {
							everythingReady.resolve();
						});
					}
				}
			}, true);

			angularFire(firebaseRef.child('users/' + user.id), $rootScope, 'userInfo');
		});

		angularFireAuth.initialize(firebaseRef, {
			'scope' : $rootScope,
			'path': '/login',
			'name' : 'user'
		});

		function loadGameObjects ()
		{
			console.log("loadGameObjects");
			var playersReadyDefered = $q.defer(),
				messagesReadyDefered = $q.defer(),
				promises = [];

			promises.push(playersReadyDefered.promise);
			promises.push(messagesReadyDefered.promise);
			promises.push(angularFire(firebaseRef.child('users'), $rootScope, 'users', {}));
			promises.push(angularFire(firebaseRef.child('game'), $rootScope, 'game', {}));

			$rootScope.$watchCollection('messages', function (messages) {
				if (messages) {
					messagesReadyDefered.resolve(messages);
				}
			});
			$rootScope.messages = angularFireCollection(firebaseRef.child('game/messages'));

			$rootScope.$watchCollection('players', function (players) {
				if (players) {
					playersReadyDefered.resolve(players);
				}
			});
			$rootScope.players = angularFireCollection(firebaseRef.child('game/players'));

			return $q.all(promises);
		}
	});


	/**
	 * Service that returns a Promise when everything is ready (used in route resolver).
	 */
	app.factory('WaitEverythingReady', function () {
		return everythingReady.promise;
	});


	/**
	 * Configure routes.
	 */
	app.config(function($routeProvider)
	{
		$routeProvider
			.when('/login', { templateUrl: 'user/login.html' })
			.when('/profile', { templateUrl: 'user/profile.html', authRequired: true, resolve: { 'user': 'WaitEverythingReady' } })
			.when('/game', { templateUrl: 'game/game.html', authRequired: true, resolve: { 'user': 'WaitEverythingReady' } })
			.when('/admin', { templateUrl: 'game/admin.html', authRequired: true, resolve: { 'user': 'WaitEverythingReady' } })
			.otherwise({ redirectTo: '/game' });
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
		$rootScope.logout = logout;

		//
		// Game process methods
		//

		function createGame () {
			$rootScope.game.status = 'WAITING';
		}

		function joinGame () {
			var joinRef = $rootScope.players.add({
				'user'   : $rootScope.user.id,
				'status' : 'ALIVE',
				'voteFor': null
			});
			console.log("Join id: ", joinRef.name());
			$rootScope.userInfo.joinRef = joinRef.name();
		}

		function quitGame () {
			console.log("quitGame for: ", $rootScope.userInfo.joinRef);
			if ($rootScope.userInfo.joinRef) {
				delete $rootScope.userInfo.joinRef;
			}
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
				roles = [], teams = [];

			for (i=0 ; i<chars.length ; i++) {
				for (j=0 ; j<chars[i].count ; j++) {
					roles.push(chars[i].id);
					teams.push(chars[i].team);
				}
			}

			var promises = [];

			angular.forEach($rootScope.players, function (player) {
				var deferred = $q.defer();
				var r = Math.floor(Math.random()*roles.length);
				player.role = roles[r];
				player.team = teams[r];
				$rootScope.players.update(player, function () {
					resolveDefer(deferred);
				});
				console.log("Assigning ", player.role, " to ", player);
				roles.splice(r, 1);
				promises.push(deferred.promise);
			});

			return $q.all(promises);
		}

		function beginGame (selectedChars)
		{
			assignCharacters(selectedChars).then(function () {
				console.log("All chars assigned and synced!");
				postGameMessage("La partie vient de commencer ! Bon jeu et... bonne chance !");
				beginNight();
				$rootScope.game.status = 'RUNNING';
				$location.path('/game');
			});
		}

		function initUserPlayer ()
		{
			console.log("initUserPlayer");
			var player = $rootScope.players.getByName($rootScope.user.joinRef);
			$rootScope.me = {
				'char'   : angular.copy(lgCharacters.characterById(player.role)),
				'player' : player
			};
		}

		//
		// Night and day
		//

		function beginDay () {
			resetVotes().then(function () {
				$rootScope.game.time = 'D';
			});
		}

		function endDay () {
			killVotedPlayer().then(angular.noop, stopGame);
		}

		function beginNight () {
			resetVotes().then(function () {
				$rootScope.game.time = 'N';
			});
		}

		function resetVotes ()
		{
			var promises = [];
			angular.forEach($rootScope.players, function (p) {
				var deferred = $q.defer();
				p.voteFor = null;
				$rootScope.players.update(p, function () {
					resolveDefer(deferred);
				});
				promises.push(deferred.promise);
			});
			return $q.all(promises);
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


		function iAmDead () {
			return $rootScope.me && isDead($rootScope.me.player);
		}
		$rootScope.iAmDead = iAmDead;


		function iAmAlive () {
			return $rootScope.me && isAlive($rootScope.me.player);
		}
		$rootScope.iAmAlive = iAmAlive;


		//
		// Chat
		//

		function postMessage (msg) {
			var defer = $q.defer();
			$rootScope.messages.add({
				sender: $rootScope.user.id,
				body: msg,
				date: new Date().getTime(),
				time: $rootScope.game.time,
				team: $rootScope.me ? $rootScope.me.char.team : '',
				dead: iAmDead()
			}, function () {
				resolveDefer(defer);
			});
			return defer.promise;
		}

		function postGameMessage (msg) {
			var defer = $q.defer();
			$rootScope.messages.add({
				sender: 'system',
				body: msg,
				date: new Date().getTime(),
				time: $rootScope.game.time
			}, function () {
				resolveDefer(defer);
			});
			return defer.promise;
		}


		function resolveDefer (defer) {
			$timeout(function () {
				defer.resolve();
			});
		}


		function killVotedPlayer ()
		{
			var votesByPlayer = {};
			angular.forEach($rootScope.players, function (p) {
				if (p.voteFor) {
					votesByPlayer[p.voteFor] = (votesByPlayer[p.voteFor] || 0) + 1;
				}
			});

			var maxVotes = 0, deads = [], dead = null;
			// Get max value for votes
			angular.forEach(votesByPlayer, function (count) {
				maxVotes = Math.max(maxVotes, count);
			});
			if (maxVotes > 0) {
				// Get which players have this vote count
				angular.forEach(votesByPlayer, function (count, playerId) {
					if (count === maxVotes) {
						deads.push(playerId);
					}
				});
			}

			if (deads.length === 1) {
				dead = deads[0];
			}
			// Multiple loosers
			else if (deads.length > 1) {
				dead = deads[Math.floor(Math.random()*deads.length)];
			}

			if (! dead) {
				return postGameMessage("Personne n'est mort ! Quel paisible village...");
			}
			else {
				return killPlayer(dead);
			}
		}


		$rootScope.$on('LG:NightIsOver', function ()
		{
			console.log("Nuit terminée !");
			// Only the game master's client will end the night.
			if (isGameMaster()) {
				console.log("Maître du jeu -> terminer la nuit...");
				killVotedPlayer().then(beginDay, stopGame);
			}
		});


		function myTeamIs(team) {
			return $rootScope.me && $rootScope.me.char && $rootScope.me.char.team === team;
		}
		$rootScope.myTeamIs = myTeamIs;


		function checkEndOfGame ()
		{
			var alives = {
				'L' : 0,
				'V' : 0
			};
			angular.forEach($rootScope.players, function (player) {
				if (player.status === 'ALIVE') {
					alives[player.team]++;
				}
			});

			if (alives.L === 0 && alives.V > 0) {
				return 'V';
			}
			else if (alives.L > 0 && alives.V === 0) {
				return 'L';
			}
			return null;
		}


		function killPlayer (pId)
		{
			console.log("killing player ", pId);
			var defer = $q.defer();
			console.log("killing player ", pId);
			var looser = $rootScope.players.getByName(pId);
			looser.status = 'DEAD';
			$rootScope.players.update(looser, function () {
				console.log("killed player synced!");
				$timeout(function () {
					postGameMessage("Le joueur <strong>" + $rootScope.users[looser.user].name + "</strong> est mort. Paix à son âme !").then(function () {
						console.log("message posted! resolving...");
						var end = checkEndOfGame(), endMessage;
						if (! end) {
							defer.resolve();
						}
						else {
							if (end === 'V') {
								endMessage = "Les villageois ont gagné ! La raison du plus fort et toujours la meilleure !";
							}
							else {
								endMessage = "Les loups ont gagné ! Quelle tristesse...";
							}
							postGameMessage(endMessage).then(function () {
								defer.reject();
							});
						}
					});
				});
			});
			return defer.promise;
		}

		//
		// Public API
		//

		return {

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
			endDay : endDay,

			isDead : isDead,
			isAlive : isAlive,

			iAmDead : iAmDead,
			iAmAlive : iAmAlive,
			myTeamIs : myTeamIs,

			postMessage : postMessage
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