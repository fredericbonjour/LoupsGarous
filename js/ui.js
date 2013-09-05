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
	app.directive('ffMessage', function (Loups, $rootScope, $sce)
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
				'message' : '=ffMessage'
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


	app.directive('ffCharactersList', function (Loups)
	{
		return {
			'restrict' : 'A',
			'template' :
				'<h3>Loups</h3>' +
				'<div ng-repeat="char in characters | filter:{type:\'L\'}" ff-character="char"></div>' +
				'<h3>Villageois</h3>' +
				'<div ng-repeat="char in characters | filter:{type:\'V\'}" ff-character="char"></div>',
			'require' : 'ngModel',

			'link' : function (scope, iElement, iAttrs, ngModel)
			{
				var selected = [];
				scope.characters = Loups.characters;

				scope.$watch('characters', function (chars, old) {
					selected.length = 0;
					angular.forEach(chars, function (char) {
						if (char.selected) {
							selected.push(char);
						}
					});
					ngModel.$setViewValue(selected);
				}, true);
			}
		}
	});


	app.directive('ffCharacter', function ()
	{
		return {
			'restrict' : 'A',
			'template' : '<figure ng-click="toggleSelect()" ng-class="{\'selected\': character.selected}"><img ng-src="images/cartes/{{ character.id }}.png"/><figcaption>{{ character.name }}</figcaption></figure>',
			'replace'  : true,
			'scope' : {
				character : '=ffCharacter'
			},

			'link' : function (scope, iElement, iAttrs, ctrl)
			{
				scope.toggleSelect = function () {
					scope.character.selected = ! scope.character.selected;
				};
			}
		}
	});


	app.directive('ffUser', function ($rootScope)
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
				userId : '=ffUser'
			},

			'link' : function (scope, iElement, iAttrs, ctrl)
			{
				scope.users = $rootScope.users;
			}
		}
	});


})(moment);