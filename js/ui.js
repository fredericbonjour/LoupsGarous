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
	app.directive('lgMessage', function (LG, $rootScope, $sce, lgSmileys)
	{
		return {
			'restrict' : 'A',
			'template' :
				'<a class="pull-left" href="javascript:;" ng-if="!sameSender">' +
					'<img class="media-object" width="32px" height="32px" style="width:32px;height:32px;" ng-src="images/avatars/{{ sender.avatar }}">' +
				'</a>' +
				'<div class="media-body" ng-if="!sameSender">' +
					'<h4 class="media-heading">{{ sender.name }}</h4>' +
					'<small class="pull-right text-muted"><time lg-time-ago="message.date"></time></small>' +
					'<div ng-bind-html="trustedBody"></div>' +
				'</div>' +
				'<div class="media-body" ng-if="sameSender">' +
					'<small class="pull-right text-muted"><time lg-time-ago="message.date"></time></small>' +
					'<div ng-bind-html="trustedBody"></div>' +
				'</div>',

			'scope' : {
				'message' : '=lgMessage'
			},

			'link' : function (scope, iElement)
			{
				scope.sender = $rootScope.users[scope.message.sender];
				scope.trustedBody = $sce.trustAsHtml(lgSmileys.parse(scope.message.body));
				/* FIXME
				scope.sameSender = previousSender == scope.message.sender;
				if (scope.sameSender) {
					iElement.addClass('same-sender');
				}
				if ($rootScope.user.id == scope.message.sender) {
					iElement.addClass('me');
				}
				previousSender = scope.message.sender;
				*/
			}
		};
	});


	/**
	 *
	 */
	app.directive('lgMessageList', function ()
	{
		return {
			'restrict' : 'A',
			'template' :
				'<ul class="media-list messages">' +
					'<li class="media" ng-repeat="msg in messages" lg-message="msg" ></li>' +
				'</ul>',

			'scope' : {
				'messages' : '=lgMessageList'
			},

			'link' : function (scope, iElement)
			{
			}
		};
	});





	app.directive('lgCharactersList', function (lgCharacters)
	{
		return {
			'restrict' : 'A',
			'template' :
				'<div ng-repeat="char in characters" lg-character-select="char"></div>',
			'require' : 'ngModel',

			'link' : function (scope, iElement, iAttrs, ngModel)
			{
				var selected = {
					'count' : 0,
					'chars' : []
				};
				scope.characters = lgCharacters.characters;

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


	app.directive('lgCharacterSelect', function ()
	{
		return {
			'restrict' : 'A',
			'template' :
				'<figure ng-click="toggleSelect()" class="character clearfix select" ng-class="{\'selected\': character.count > 0}">' +
					'<img class="card" ng-src="images/cartes/{{ character.id }}.png"/>' +
					'<figcaption>' +
						'<span ng-show="character.count > 0" class="count">{{ character.count }}</span>' +
						'<h4>{{ character.name }}</h4>' +
						'<p>{{ character.desc }}</p>' +
						'<div class="btn-group">' +
							'<button class="btn btn-default" type="button" ng-disabled="character.count > 0 && ! character.multiple" ng-click="character.count = character.count+1"><i class="icon-plus"></i></button>' +
							'<button class="btn btn-default" type="button" ng-disabled="! character.count" ng-click="character.count = character.count-1"><i class="icon-minus"></i></button>' +
						'</div>' +
					'</figcaption>' +
				'</figure>',
			'replace'  : true,
			'scope' : {
				character : '=lgCharacterSelect'
			},

			'link' : function (scope, iElement, iAttrs, ctrl)
			{
				scope.character.count = 0;
			}
		}
	});


	app.directive('lgCharacter', function ()
	{
		return {
			'restrict' : 'A',
			'template' :
				'<figure class="character clearfix">' +
					'<img class="card" ng-src="images/cartes/{{ character.id }}.png"/>' +
					'<figcaption>' +
					'<h4>{{ character.name }}</h4>' +
					'<p>{{ character.desc }}</p>' +
					'</figcaption>' +
					'</figure>',
			'replace'  : true,
			'scope' : {
				character : '=lgCharacter'
			},

			'link' : function (scope, iElement, iAttrs, ctrl)
			{
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


	app.directive('lgPlayersPoll', function (LG)
	{
		return {
			'restrict' : 'A',
			'template' :
				'<button ng-click="toggleVote(p)" class="btn btn-block" ng-class="{\'btn-primary\': p.$id==lastVoteId}" type="button" ng-repeat="(name,p) in players">{{ users[p.user].name }} <span class="badge">{{ p.votes }}</span></button>',
			scope : true,

			'link' : function (scope, iElement, iAttrs, ngModel)
			{
				scope.lastVoteId = null;

				scope.players = LG.bindCollection('game/players');

				scope.toggleVote = function (player) {
					if (scope.lastVoteId) {
						if (player.$id === scope.lastVoteId) {
							player.votes--;
							scope.players.update(player);
							scope.lastVoteId = null;
							return;
						}
						else {
							scope.players.getByName(scope.lastVoteId).votes--;
							scope.players.update(scope.lastVoteId);
						}
					}
					player.votes++;
					scope.players.update(player);
					scope.lastVoteId = player.$id;
				};
			}
		}
	});


	app.directive('lgGameMasterUi', function () {
		return {
			'restrict' : 'A',
			'template' :
				'<div class="well">' +
					'<h4>Maître du jeu</h4>' +
					'<button type="button" class="btn btn-danger btn-block" ng-click="gameMaster.stopGame()">Arrêter la partie</button>' +
					'<button type="button" ng-if="isNight()" class="btn btn-block btn-warning" ng-click="gameMaster.stopNight()"><i class="icon-sun"></i> Le jour se lève !</button>' +
					'<button type="button" ng-if="isDay()" class="btn btn-block btn-warning" ng-click="gameMaster.stopDay()"><i class="icon-moon"></i> La nuit tombe !</button>' +
				'</div>'
		}
	});


})(moment);