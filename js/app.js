(function() {

	var FIREBASE_URL = 'https://ff-loups.firebaseio.com/';

	var app = angular.module("loups", ["ngRoute", "firebase"]);

	app.config(function($routeProvider)
	{
		$routeProvider
			.when('/login', { templateUrl: 'user/login.html' })
			.when('/profile', { templateUrl: 'user/profile.html' })
			.when('/game', { templateUrl: 'game/game.html' })
			.otherwise({ redirectTo: '/game' });
	});



    app.service('Loups', function (angularFire, $rootScope, $timeout, $location) {

	    var firebase, auth;

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
				    $location.path('/game');
				    bindUser($rootScope, 'userInfo');
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

	    function bind ($scope, name, path) {
		    var ref = path ? firebase.child(path) : firebase;
		    angularFire(ref, $scope, name);
	    }

	    function bindUser ($scope, name) {
		    bind($scope, name, 'users/' + $rootScope.user.id);
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

			login : login,

			checkLogin : function () {
				if (! $rootScope.user) {
					$location.path('/login');
					return false;
				}
				return true;
			}
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