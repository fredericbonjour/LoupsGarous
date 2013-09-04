(function() {

	var app = angular.module("loups");


	app.controller('ProfileController', function (Loups, $scope, $rootScope, $location)
	{
		console.log("ProfileController");
		if (Loups.checkLogin()) {
			$scope.userInfo = {};
			Loups.bindUser($scope, 'userInfo');
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
        }
    });


	app.controller('LoginController', function ($scope, Loups)
	{
		console.log("LoginController");

		$scope.login = function () {
			Loups.login($scope.username, $scope.password);
		};
	});

})();