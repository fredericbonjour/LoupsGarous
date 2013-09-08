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
		console.log("app run");

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
					console.log("check smiley: ", name, symbol);
					var regexp = new RegExp(symbol, "ig");
					input = input.replace(regexp, ':' + name + ':');
				});
				return input.replace(/:([a-z]+):/g, '<i class="icon-smiley-$1"></i>');
			}
		};
	});


	app.service('LG', function (angularFire, angularFireAuth, angularFireCollection, $rootScope, $location) {

		// Bindings
		bind($rootScope, 'users', 'users');
		bind($rootScope, 'game', 'game');


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
		// Public API
		//

		return {
			user : $rootScope.user,

			bind : bind,
			bindUser : bindUser,
			bindCollection : bindCollection,

			login : login,
			logout : logout,

			createGame : function () {
				$rootScope.players = this.bindCollection('game/players', function () {
					$rootScope.game.status = 'WAITING';
				});
			},

			joinGame : function () {
				$rootScope.$watch('players', function (players) {
					if (players) {
						var joinRef = $rootScope.players.add({
							'user'   : $rootScope.user.id,
							'status' : 'ALIVE',
							'votes'  : 0
						});
						console.log("Join id: ", joinRef.name());
						$rootScope.userInfo.joinRef = joinRef.name();
					}
				});
				$rootScope.players = bindCollection('game/players');
			},

			quitGame : function () {
				$rootScope.players.remove($rootScope.userInfo.joinRef);
				delete $rootScope.userInfo.joinRef;
			}

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