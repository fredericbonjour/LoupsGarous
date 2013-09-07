(function (Firebase) {

	var app = angular.module("LoupsGarous", ["ngRoute", "firebase"]),
		firebaseRef = new Firebase(LG_FIREBASE_URL);


	app.config(function($routeProvider)
	{
		$routeProvider
			.when('/login', { templateUrl: 'user/login.html' })
			.when('/profile', { templateUrl: 'user/profile.html', authRequired: true })
			.when('/game', { templateUrl: 'game/game.html', authRequired: true })
			.when('/new-game', { templateUrl: 'game/new-game.html', authRequired: true })
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


	app.service('LG', function (angularFire, angularFireAuth, angularFireCollection, $rootScope, $location) {

		bind($rootScope, 'users', 'users');

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

			logout : logout
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