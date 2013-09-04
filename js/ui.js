(function (moment) {

	"use strict";

	var app = angular.module("LoupsGarous");


	/**
	 * Usage:
	 * <time ff-time-ago="<dateObject>"></time>
	 */
	app.directive('ffTimeAgo', function ($timeout)
	{
		var INTERVAL = 60*1000;

		return {
			'restrict' : 'A',
			'scope' : {
				'date' : '=ffTimeAgo'
			},

			'link' : function (scope, iElement) {
				var stop;

				function update () {
					iElement.html(moment(scope.date).fromNow());
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
	});


	/**
	 * Usage:
	 * <div ff-message="<messageObject>"></div>
	 */
	app.directive('ffMessage', function ($rootScope, $sce)
	{
		return {
			'restrict' : 'A',
			'template' : '<div ng-class="{\'me\': meId == message.sender.id}"><span class="sender">{{ message.sender.name }}</span> <span class="pull-right text-muted"><i class="icon-time"></i> <time ff-time-ago="message.date"></time></span><div class="content" ng-bind-html="trustedBody"></div></div>',
			'replace' : true,
			'scope' : {
				'message' : '=ffMessage'
			},

			'link' : function (scope) {
				scope.meId = $rootScope.user.id;
				scope.$watch('message', function (message) {
					if (message) {
						scope.trustedBody = $sce.trustAsHtml(message.body
							.replace(/[;:][D\)]/gi, '<i class="icon-smile"></i>')
							.replace(/:[\(]/gi, '<i class="icon-frown"></i>')
						);
					}
				});
			}
		};
	});


})(moment);