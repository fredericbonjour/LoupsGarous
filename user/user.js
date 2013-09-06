(function() {

	var app = angular.module("LoupsGarous");


	app.controller('ProfileController', function (LG, $scope, $rootScope)
	{
		console.log("ProfileController");
		if (LG.checkLogin()) {
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
        }
    });


	app.controller('LoginController', function ($scope, LG)
	{
		console.log("LoginController");

		$scope.login = function () {
			LG.login($scope.username + '@lg.fruityfred.com', $scope.password);
		};
	});

})();