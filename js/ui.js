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


	app.directive('lgPlayersPoll', function (LG, $rootScope)
	{
		return {
			'restrict' : 'A',
			'template' :
				'<div class="panel panel-default">' +
					'<div class="panel-heading"><h4><i class="icon-group"></i> Joueurs</h4></div>' +
					'<ul class="list-group">' +
						'<li class="list-group-item" ng-class="{\'active\':p.$id==me.player.$id}" ng-repeat="(name,p) in players">' +
							'<span class="pull-right votes-count" ng-class="{\'text-muted\':countVotes(p)==0}">{{ countVotes(p) }}</span>' +
							'<button ng-click="toggleVote(p)" class="btn btn-default btn-sm pull-left" ng-class="{\'btn-success\': p.$id == me.player.voteFor}" type="button"><i class="icon-thumbs-up"></i></button>' +
							' <strong>{{ users[p.user].name }}</strong>' +
							'<br/><small>' +
							'<span ng-if="!p.voteFor">n\'a pas encore voté</span>' +
							'<span ng-if="p.voteFor && p.$id == p.voteFor"><i class="icon-arrow-right"></i> lui-même</span>' +
							'<span ng-if="p.voteFor && p.$id != p.voteFor"><i class="icon-arrow-right"></i> {{users[game.players[p.voteFor].user].name}}</span>' +
							'</small>' +
						'</li>' +
					'</ul>' +
					'<div class="panel-footer">' +
						'<div ng-pluralize="" count="mostVotedPlayers.length" when="{\'0\':\'Aucun vote pour le moment\', \'one\':\'Le plus voté :\', \'other\':\'Les {} plus votés :\'}"></div>' +
						'<span class="label label-danger" ng-repeat="p in mostVotedPlayers">{{ users[game.players[p].user].name }}</span>' +
					'</div>' +
				'</div>',
			scope : true,

			'link' : function (scope, iElement, iAttrs, ngModel)
			{
				scope.players = {};

				$rootScope.$watch('game.time', function () {
					if (LG.isNight()) {
						angular.forEach($rootScope.players, function (player, id) {
							if (player.role === 'vill') {
								scope.players[id] = player;
							}
						});
					}
					else {
						scope.players = $rootScope.players;
					}
				});

				scope.toggleVote = function (player)
				{
					var me = $rootScope.me.player;
					if (me.voteFor === player.$id) {
						me.voteFor = null;
					}
					else {
						me.voteFor = player.$id;
					}
					$rootScope.players.update(me);
				};

				scope.votesByPlayer = {};

				scope.countVotes = function (player) {
					var count = 0;
					angular.forEach($rootScope.players, function (p) {
						if (p.voteFor === player.$id) {
							count++
						}
					});
					scope.votesByPlayer[player.$id] = count;
					return count;
				};

				scope.mostVotedPlayers = [];

				scope.$watch(function () {
					var players = [];
					var maxVotes = 0;
					// Get max value for votes
					angular.forEach(scope.votesByPlayer, function (count) {
						maxVotes = Math.max(maxVotes, count);
					});
					if (maxVotes > 0) {
						// Get which players have this vote count
						angular.forEach(scope.votesByPlayer, function (count, playerId) {
							if (count === maxVotes) {
								players.push(playerId);
							}
						});
					}
					scope.mostVotedPlayers = players;
				});

			}
		}
	});


	app.directive('lgGameMasterUi', function (LG) {
		return {
			'restrict' : 'A',
			'template' :
				'<div class="panel panel-danger">' +
					'<div class="panel-heading"><h4><i class="icon-cog"></i> Maître du jeu</h4></div>' +
					'<div class="panel-body">' +
						'<button type="button" class="btn btn-danger btn-block" ng-click="stopGame()">Arrêter la partie</button>' +
						'<button type="button" ng-if="isNight()" class="btn btn-block btn-warning" ng-click="beginDay()"><i class="icon-sun"></i> Le jour se lève !</button>' +
						'<button type="button" ng-if="isDay()" class="btn btn-block btn-warning" ng-click="beginNight()"><i class="icon-moon"></i> La nuit tombe !</button>' +
					'</div>' +
				'</div>',
			'scope' : true,

			'link' : function (scope)
			{
				scope.stopGame = function () {
					if (confirm("Souhaitez-vous réellemment arrêter cette partie ? Ce serait dommage...")) {
						LG.stopGame();
					}
				};

				scope.beginDay = function () {
					LG.beginDay();
				};

				scope.beginNight = function () {
					LG.beginNight();
				};
			}
		}
	});

	app.directive('lgTimer', function ($rootScope, $timeout) {
		return {
			'restrict' : 'A',
			'template' :
				'<div class="panel panel-default" ng-class="{\'panel-danger\':time <= 30}">' +
					'<div class="panel-heading"><h4><i class="icon-time"></i> Temps</h4></div>' +
					'<div class="panel-body">{{ time | remainingTime }}</div>' +
				'</div>',

			'scope' : {
				'whenOver' : '&'
			},

			'link' : function (scope)
			{
				var timer;

				function tick () {
					scope.time--;
					if (scope.time === 0) {
						console.log("La nuit est finie !");
					}
					else {
						timer = $timeout(tick, 1000);
					}
				}

				function stop () {
					if (timer) {
						$timeout.cancel(timer);
					}
				}

				$rootScope.$watch('game.time', function (value, old) {
					console.log("game.time=", value, old);
					if (value === 'N' && old === 'D') {
						scope.time = 45 + 1;
						stop();
						tick();
					}
					else if (value === 'D') {
						stop();
					}
				}, true);
			}
		}
	});


})(moment);