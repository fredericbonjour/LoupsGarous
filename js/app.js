(function(Firebase) {

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


	app.run(function (angularFireAuth, $rootScope) {
		angularFireAuth.initialize(firebaseRef, {
			'scope' : $rootScope,
			'path': '/login',
			'name' : 'user'
		});
	});


	app.service('LG', function (angularFire, angularFireAuth, angularFireCollection, $rootScope, $location) {

		$rootScope.$watch('userInfo', function (info) {
			if (info && $rootScope) {
				angular.extend($rootScope.user, info);
			}
		}, true);

		bind($rootScope, 'allUsers', 'users');

		function bind ($scope, name, path) {
			var ref = path ? firebaseRef.child(path) : firebaseRef;
			return angularFire(ref, $scope, name);
		}

		function bindUser ($scope, name) {
			return bind($scope, name, 'users/' + $rootScope.user.id);
		}

		function bindCollection (path, callback) {
			return angularFireCollection(new Firebase(LG_FIREBASE_URL + path), callback);
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

			characters : [
				{
					'id' : 'loup',
					'name' : 'loup',
					'desc' : 'Chaque nuit, vous votez pour dévorer un villageois. Le jour, vous masquer votre identité pour échapper à la vindicte populaire. Vous gagnez si tous les villageois sont tués.',
					'type' : 'L',
					'multiple' : true
				},
				{
					'id' : 'vill',
					'name' : 'villageois',
					'desc' : "Vous n'avez pas de pouvoir particulier. Survivez aux loups pour remporter la victoire !",
					'type' : 'V',
					'multiple' : true
				},
				{
					'id' : 'sorc',
					'name' : 'sorcière',
					'desc' : "Vous disposez de deux potions magiques : une potion de vie pour ressuciter un joueur tué par les loups-garous, et une potion de mort pour éliminer un joueur. Survivez aux loups pour remporter la victoire !",
					'type' : 'V',
					'multiple' : false
				},
				{
					'id' : 'voya',
					'name' : 'voyante',
					'desc' : "Chaque nuit, vous aurez l'occasion de découvrir l'identité d'un joueur de votre choix. Survivez aux loups pour remporter la victoire !",
					'type' : 'V',
					'multiple' : false
				}
			],

			characterById : function (id) {
				for (var i=0 ; i<this.characters.length ; i++) {
					if (this.characters[i].id === id) {
						return this.characters[i];
					}
				}
				return null;
			},

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