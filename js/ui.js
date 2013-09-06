(function (moment) {

	"use strict";

	var app = angular.module("LoupsGarous");


	/**
	 * Usage:
	 * <time ff-time-ago="<dateObject>"></time>
	 */
	app.directive('lgTimeAgo', function ($timeout)
	{
		var INTERVAL = 60*1000;

		return {
			'restrict' : 'A',
			'scope' : {
				'date' : '=lgTimeAgo'
			},

			'link' : function (scope, iElement)
			{
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
	app.directive('lgMessage', function (LG, $rootScope, $sce)
	{
		return {
			'restrict' : 'A',
			'template' :
				'<a class="pull-left" href="javascript:;">' +
					'<img class="media-object" width="32px" height="32px" style="width:32px;height:32px;" ng-src="images/avatars/{{ users[message.sender].avatar }}">' +
				'</a>' +
				'<div class="media-body">' +
					'<h4 class="media-heading">{{ users[message.sender].name }}</h4>' +
					'<small class="pull-right text-muted"><time ff-time-ago="message.date"></time></small>' +
					'<div ng-bind-html="trustedBody"></div>' +
				'</div>',

			'scope' : {
				'message' : '=lgMessage'
			},

			'link' : function (scope)
			{
				scope.users = $rootScope.users;
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


	app.directive('lgCharactersList', function (LG)
	{
		return {
			'restrict' : 'A',
			'template' :
				'<div ng-repeat="char in characters" ff-character="char" selectable="true"></div>',
			'require' : 'ngModel',

			'link' : function (scope, iElement, iAttrs, ngModel)
			{
				var selected = {
					'count' : 0,
					'chars' : []
				};
				scope.characters = LG.characters;

				scope.$watch('characters', function (chars, old) {
					selected.count = 0;
					selected.chars.length = 0;
					angular.forEach(chars, function (char) {
						if (char.count) {
							selected.chars.push(char);
							selected.count += char.count;
						}
					});
					ngModel.$setViewValue(selected);
				}, true);
			}
		}
	});


	app.directive('lgCharacter', function ()
	{
		return {
			'restrict' : 'A',
			'template' :
				'<figure ng-click="toggleSelect()" class="clearfix" ng-class="{\'selected\': character.count > 0}">' +
					'<img ng-src="images/cartes/{{ character.id }}.png"/>' +
					'<figcaption>' +
						'<span ng-show="character.count > 0" class="count">{{ character.count }}</span>' +
						'<h4>{{ character.name }}</h4>' +
						'<p>{{ character.desc }}</p>' +
						'<div class="btn-group" ng-if="selectable">' +
							'<button class="btn btn-default" type="button" ng-disabled="character.count > 0 && ! character.multiple" ng-click="character.count = character.count+1"><i class="icon-plus"></i></button>' +
							'<button class="btn btn-default" type="button" ng-disabled="! character.count" ng-click="character.count = character.count-1"><i class="icon-minus"></i></button>' +
						'</div>' +
					'</figcaption>' +
				'</figure>',
			'replace'  : true,
			'scope' : {
				character : '=lgCharacter',
				selectable : '@'
			},

			'link' : function (scope, iElement, iAttrs, ctrl)
			{
				scope.character.count = 0;
			}
		}
	});


	app.directive('lgUser', function ($rootScope)
	{
		return {
			'restrict' : 'A',
			'template' :
				'<div class="media">' +
					'<a class="pull-left" href="#">' +
						'<img class="media-object" style="width:20px;height:20px;" ng-src="images/avatars/{{ users[userId].avatar }}">' +
					'</a>' +
					'<div class="media-body">' +
						'<h4 class="media-heading">{{ users[userId].name }}</h4>' +
					'</div>' +
				'</div>',

			'replace'  : true,
			'scope' : {
				userId : '=lgUser'
			},

			'link' : function (scope, iElement, iAttrs, ctrl)
			{
				scope.users = $rootScope.users;
			}
		}
	});


})(moment);