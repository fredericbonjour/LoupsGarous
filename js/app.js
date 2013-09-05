(function() {

	var FIREBASE_URL = 'https://ff-loups.firebaseio.com/';

	var app = angular.module("LoupsGarous", ["ngRoute", "firebase"]);

	app.config(function($routeProvider)
	{
		$routeProvider
			.when('/login', { templateUrl: 'user/login.html' })
			.when('/profile', { templateUrl: 'user/profile.html' })
			.when('/game', { templateUrl: 'game/game.html' })
			.when('/newgame', { templateUrl: 'game/newgame.html' })
			.otherwise({ redirectTo: '/game' });
	});



    app.service('Loups', function (angularFire, angularFireCollection, $rootScope, $timeout, $location) {

	    var firebase, auth, currentPath = $location.path();

	    firebase = new Firebase(FIREBASE_URL);
	    auth = new FirebaseSimpleLogin(firebase, function(error, user) {
		    $timeout(function () {
			    if (error) {
					console.log("Service: user error");
					$rootScope.user = null;
					$location.path('/login');
				}
				else if (user) {
					console.log("Service: user logged in!");
					$rootScope.user = user;
					bindUser($rootScope, 'userInfo').then(function () {
					    $location.path(currentPath);
					});
				}
				else {
					console.log("Service: user not logged in.");
					$rootScope.user = null;
					$location.path('/login');
			    }
		    });
	    });

		$rootScope.$watch('userInfo', function (info) {
			if (info && $rootScope) {
				angular.extend($rootScope.user, info);
		    }
		}, true);

	    bind($rootScope, 'users', 'users');

	    function bind ($scope, name, path) {
		    var ref = path ? firebase.child(path) : firebase;
		    return angularFire(ref, $scope, name);
	    }

	    function bindUser ($scope, name) {
		    return bind($scope, name, 'users/' + $rootScope.user.id);
	    }

	    function bindCollection (path, callback) {
		    return angularFireCollection(new Firebase(FIREBASE_URL + path), callback);
	    }

	    function login (user, pass) {
		    auth.login('password', {
			    email : user,
			    password : pass
		    });
	    }

		// Public API

		return {

			firebase : firebase,
			user : $rootScope.user,

			bind : bind,
			bindUser : bindUser,
			bindCollection : bindCollection,

			login : login,

			checkLogin : function () {
				if (! $rootScope.user) {
					$location.path('/login');
					return false;
				}
				return true;
			},

			characters : [
				{
					'id' : 'loup',
					'name' : 'loup',
					'type' : 'L'
				},
				{
					'id' : 'vill',
					'name' : 'villageois',
					'type' : 'V'
				},
				{
					'id' : 'sorc',
					'name' : 'sorcière',
					'type' : 'V'
				},
				{
					'id' : 'voya',
					'name' : 'voyante',
					'type' : 'V'
				}
			]
		};

	});


	app.controller('NavBarController', function (Loups, $scope, $rootScope) {
		$rootScope.$watch('user', function (user, old) {
			if (user) {
				Loups.bindUser($scope, 'userInfo');
			}
		}, true);
	});


})();