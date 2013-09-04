(function() {

	"use strict";

	var app = angular.module("LoupsGarous");

	app.directive('ffTimeAgo', ['$timeout', function ($timeout) {

		var INTERVAL = 60*1000;

		return {
			'restrict' : 'A',
			'scope' : {
				'date' : '=ffTimeAgo'
			},

			'link' : function (scope, element, attrs) {
				var stop,
					content = element.html();

				function update () {
					var timeAgo = moment(scope.date).fromNow();
					if (content) {
						element.html(content.replace(/\{time\}/, timeAgo));
					}
					else {
						element.html(timeAgo);
					}
					// Re-launch timer for next update
					stop = $timeout(update, INTERVAL);
				}

				scope.$watch('date', function (value) {
					if (value) {
						if (stop) {
							$timeout.cancel(stop);
						}
						update();
					}
				}, true);

				scope.$on('$destroy', function () {
					$timeout.cancel(stop);
				});
			}
		};
	}]);

})();