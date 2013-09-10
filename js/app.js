(function (Firebase) {

	var app = angular.module("LoupsGarous", ["ngRoute", "firebase"]),
		firebaseRef = new Firebase(LG_FIREBASE_URL);


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

		$rootScope.$watchCollection('players', function (players, old) {
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

		function stopNight () {
			$rootScope.game.time = 'D';
		}

		function stopDay () {
			$rootScope.game.time = 'N';
		}

		function isNight () {
			return $rootScope.game && $rootScope.game.time === 'N';
		}
		$rootScope.isNight = isNight;

		function isDay () {
			return ! isNight();
		}
		$rootScope.isDay = isDay;

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
			stopNight : stopNight,
			stopDay : stopDay,
			isNight : isNight,
			isDay : isDay
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


})(Firebase);