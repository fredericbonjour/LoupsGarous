(function (Firebase) {

	var app = angular.module("LoupsGarous", ["ngRoute", "ngAnimate", "firebase"]),
		firebaseRef = new Firebase(LG_FIREBASE_URL),
		everythingReady;

	app.constant('NIGHT_DURATION', 15);

	app.constant('lgPhase', {
		VOYANTE : 'voyante',
		LOUPS : 'loups',
		SORCIERE : 'sorciere',
		VILLAGEOIS : 'villageois'
	});

	app.constant('lgTeam', {
		LOUPS : 'L',
		VILLAGEOIS : 'V'
	});


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
					var regexp = new RegExp("\\s+"+symbol, "ig");
					input = input.replace(regexp, ' :' + name + ':');
				});
				return input.replace(/:([a-z]+):/g, '<i class="icon-smiley-$1"></i>');
			}
		};
	});


	/**
	 * Main service.
	 */
	app.service('LG', function (angularFire, angularFireAuth, angularFireCollection, $rootScope, $location, $q, $timeout, $log, lgCharacters, lgPhase, lgTeam) {

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
			resetGame().then(function () {
				$rootScope.game.status = 'WAITING';
			});
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
				$rootScope.players.remove($rootScope.userInfo.joinRef);
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
			$rootScope.game.phase = '';
		}


		function clearCollection (name)
		{
			var mids = [];
			angular.forEach($rootScope[name], function (m) {
				mids.push(m.$id);
			});
			var promises = [];
			angular.forEach(mids, function (mid) {
				var defer = $q.defer();
				$rootScope[name].remove(mid, function () {
					resolveDefer(defer);
				});
				promises.push(defer.promise);
			});
			return $q.all(promises);
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
				$rootScope.game.phase = lgPhase.VILLAGEOIS;
			});
		}

		function endDay () {
			killVotedPlayer().then(angular.noop, stopGame);
		}

		function startPhase (phase) {
			$log.log("startPhase: ", phase);
			$rootScope.game.phase = phase;
		}

		function nextPhase () {
			switch ($rootScope.game.phase)
			{
				case lgPhase.LOUPS :
					startPhase(lgPhase.LOUPS);
					break;
				case lgPhase.VOYANTE :
					startPhase(lgPhase.LOUPS);
					break;
				case lgPhase.SORCIERE :
					startPhase(lgPhase.VILLAGEOIS);
					break;
				default :
					console.warn("Que faire après la phase " + $rootScope.game.phase + " ?");
			}
		}

		function beginNight () {
			resetVotes().then(function () {
				//$rootScope.game.time = 'N';
				$log.log("Y a-t-il une voyante ?");
				if (isRoleAlive(lgCharacters.VOYANTE)) {
					$log.log("Oui !");
					startPhase(lgCharacters.VOYANTE);
				}
				else {
					$log.log("Pas de voyante : on passe au loups !");
					startPhase(lgPhase.LOUPS);
				}
			});
		}

		function getPlayerByRole (role) {
			var result = null;
			angular.forEach($rootScope.players, function (p) {
				if (p.role === role) {
					result = p;
				}
			});
			console.log("player for role ", role, ": ", result);
			return result;
		}

		function isRoleAlive (role) {
			var player = getPlayerByRole(role);
			return player && isAlive(player);
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
			return $rootScope.game && ($rootScope.game.phase === lgPhase.VOYANTE || $rootScope.game.phase === lgPhase.LOUPS);
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
			var defer = $q.defer(), msgObj;

			if ($rootScope.game.status === 'STOPPED') {
				msgObj = {
					sender: $rootScope.user.id,
					body  : msg,
					date  : new Date().getTime(),
					phase : lgPhase.VILLAGEOIS,
					team  : ''
				};
			}
			else {
				msgObj = {
					sender: $rootScope.user.id,
					body  : msg,
					date  : new Date().getTime(),
					phase : $rootScope.game.phase,
					team  : $rootScope.me ? $rootScope.me.char.team : '',
					dead  : iAmDead()
				};
			}

			$rootScope.messages.add(msgObj, function () {
				resolveDefer(defer);
			});
			return defer.promise;
		}

		function postGameMessage (msg) {
			var defer = $q.defer();
			$rootScope.messages.add({
				sender: 'system',
				body  : msg,
				date  : new Date().getTime(),
				phase : $rootScope.game.phase
			}, function () {
				resolveDefer(defer);
			});
			return defer.promise;
		}

		function clearMessages ()
		{
			return clearCollection('messages');
		}

		function clearPlayers ()
		{
			return clearCollection('players');
		}

		function resetGame ()
		{
			quitGame();
			return $q.all([
				clearMessages(),
				clearPlayers()
			]);
		}


		function resolveDefer (defer) {
			$timeout(function () {
				defer.resolve();
			});
		}


		function killVotedPlayer ()
		{
			var dead = getVotedPlayer();
			if (! dead) {
				return postGameMessage("Personne n'est mort ! Quel paisible village...");
			}
			else {
				return killPlayer(dead);
			}
		}


		function getVotedPlayer ()
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

			return dead;
		}


		function countPlayers () {
			if ($rootScope.game && $rootScope.game.players) {
				var count = 0;
				angular.forEach($rootScope.game.players, function () {
					count++;
				});
				return count;
			}
			return 0;
		}
		$rootScope.countPlayers = countPlayers;



		$rootScope.$on('LG:NightIsOver', function ()
		{
			console.log("Nuit terminée !");
			// Only the game master's client will end the night.
			if (isGameMaster()) {
				console.log("Maître du jeu -> terminer la nuit...");

				var dead = getVotedPlayer();

				if (isRoleAlive(lgCharacters.SORCIERE)) {
					startPhase(lgPhase.SORCIERE);
				}
				else {
					if (dead) {
						return killPlayer(dead).then(beginDay, stopGame);;
					}
					else {
						return postGameMessage("Personne n'est mort ! Quel paisible village...");
					}
				}
			}
		});


		function myTeamIs(team) {
			return $rootScope.me && $rootScope.me.char && $rootScope.me.char.team === team;
		}
		$rootScope.myTeamIs = myTeamIs;

		function iAm(role) {
			return $rootScope.me && $rootScope.me.char && $rootScope.me.char.id === role;
		}
		$rootScope.iAm = iAm;


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
				return lgTeam.VILLAGEOIS;
			}
			else if (alives.L > 0 && alives.V === 0) {
				return lgTeam.LOUPS;
			}
			else if (alives.L === 0 && alives.V === 0) {
				return 'A';
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
					var char = lgCharacters.characterById(looser.role);
					postGameMessage(
						"<span class=\"dead pull-left\"><img class=\"card\" src=\"images/cartes/" + looser.role + ".png\"/>" +
						"<span class=\"cross\"></span></span>" +
						"Le joueur <strong>" + $rootScope.users[looser.user].name + "</strong>" +
						" (qui était <strong>" + char.name + "</strong>)" +
						" est mort.<br/>" +
						(char.team === lgTeam.LOUPS ? "Et hop : un d'moins !" : "Paix à son âme !")
					).then(function () {
						console.log("message posted! resolving...");
						var end = checkEndOfGame(), endMessage;
						console.log("checkEndOfGame=", end);
						if (! end) {
							defer.resolve();
						}
						else {
							if (end === 'V') {
								endMessage = "Les villageois ont gagné ! La raison du plus fort et toujours la meilleure !";
							}
							else if (end === 'A') {
								endMessage = "Tout le monde est mort ! Waouh, ça craint tout ça...";
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

			postMessage : postMessage,

			nextPhase : nextPhase,

			lastKilledPlayerId : getVotedPlayer
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