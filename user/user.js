(function() {

	"use strict";

	var app = angular.module("LoupsGarous");


	app.controller('ProfileController', function (LG, $scope, $rootScope)
	{
		$scope.userInfo = {};
		LG.bindUser($scope, 'userInfo');
		$scope.$watch('userInfo', function (info, old) {
			if (info !== old) {
				$scope.profile = angular.copy(info);
			}
		});

		$scope.save = function () {
			angular.extend($rootScope.userInfo, $scope.profile);
		};

		$scope.hasChanges = function () {
			return angular.equals($scope.userInfo, $scope.profile);
		};
	});


	app.controller('LoginController', function ($scope, $location, LG, $rootScope)
	{
		$scope.loggingIn = false;
		$scope.login = function () {
			$scope.loggingIn = true;
			LG.login($scope.username + '@lg.fruityfred.com', $scope.password).then(function () {
				$location.path('/game');
			});
		};


		$rootScope.$on("angularFireAuth:error", function(evt, err) {
			console.log("Oops: ", err);
			$scope.loggingIn = false;
			$scope.error = "Ce joueur n'existe pas ou bien le mot de passe n'est pas correct.";
		});

	});

})();