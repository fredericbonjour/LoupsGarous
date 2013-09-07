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


	app.controller('LoginController', function ($scope, $location, LG)
	{
		$scope.loggingIn = false;
		$scope.login = function () {
			$scope.loggingIn = true;
			LG.login($scope.username + '@lg.fruityfred.com', $scope.password).then(function () {
				$location.path('/game');
			});
		};
	});

})();