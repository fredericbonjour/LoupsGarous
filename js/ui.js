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
				'<a class="pull-left" href="javascript:;" ng-if="! systemMessage && ! sameSender">' +
					'<img style="width:32px;height:32px;" ng-src="images/avatars/{{ sender.avatar }}">' +
				'</a>' +
				'<div ng-if="!sameSender">' +
					'<h4 ng-if="! systemMessage">{{ sender.name }}</h4>' +
					'<small class="pull-right text-muted"><time lg-time-ago="message.date"></time></small>' +
					'<div ng-bind-html="trustedBody"></div>' +
				'</div>' +
				'<div ng-if="sameSender">' +
					'<small class="pull-right text-muted"><time lg-time-ago="message.date"></time></small>' +
					'<div ng-bind-html="trustedBody"></div>' +
				'</div>',

			'scope' : {
				'message' : '=lgMessage'
			},

			'link' : function (scope, iElement)
			{
				scope.systemMessage = (scope.message.sender === 'system');
				if (scope.systemMessage) {
					iElement.addClass('system-message');
				}
				else {
					scope.sender = $rootScope.users[scope.message.sender];
					if ($rootScope.user.id == scope.message.sender) {
						iElement.addClass('me');
					}
				}
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
	app.directive('lgChatUi', function ($rootScope, $timeout, LG, lgPhase)
	{
		return {
			'restrict' : 'A',
			'templateUrl' : 'lgChatUi.html',
			'scope' : true,

			'link' : function (scope, iElement)
			{
				var chatView = iElement.find('.list-group.messages').first(),
					multitouch = (typeof window.orientation !== 'undefined'),
					prevMessageCount = 0;

				scope.availableMessages = function ()
				{
					var messages = [];
					if (scope.game && scope.game.messages) {
						angular.forEach(scope.game.messages, function (msg) {
							if (LG.iAmDead()) {
								messages.push(msg);
							}
							else if (! msg.dead && (!msg.phase || msg.phase === lgPhase.VILLAGEOIS || ($rootScope.me && msg.team === $rootScope.me.team))) {
								messages.push(msg);
							}
						});
					}
					if (! multitouch && messages.length !== prevMessageCount) {
						$timeout(function () {
							var el = chatView.get(0);
							el.scrollTop = el.scrollHeight;
						});
						prevMessageCount = messages.length;
					}
					return messages;
				};

				scope.addMessage = function ()
				{
					LG.postMessage(scope.msg);
					scope.msg = "";
				};

				function resizeHandler ()
				{
					var height = $(window).height() - chatView.offset().top - 80;
					chatView.css('max-height', height+'px');
					var el = chatView.get(0);
					el.scrollTop = el.scrollHeight;
				}
				if (! multitouch) {
					$(window).resize(resizeHandler);
					$timeout(resizeHandler);
				}

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
				'<div class="panel panel-default">' +
					'<div class="panel-heading" ng-click="showDesc = ! showDesc" style="cursor: pointer;">' +
						'<h4>' +
							'<img class="card small pull-right" ng-src="images/cartes/{{ character.id }}.png"/> ' +
							'{{ character.name }}' +
						'</h4>' +
					'</div>' +
					'<div class="panel-body" ng-if="showDesc">' +
						'<p>{{ character.desc }}</p>' +
					'</div>' +
				'</div>',
			'replace'  : true,
			'scope' : {
				character : '=lgCharacter'
			},

			'link' : function (scope, iElement, iAttrs, ctrl)
			{
				scope.showDesc = false;
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


	app.directive('lgPlayersPoll', function (LG, lgPhase, $rootScope)
	{
		return {
			'restrict' : 'A',
			'template' :
				'<div class="panel panel-info">' +
					'<div class="panel-heading"><h4><i class="icon-group"></i> Joueurs</h4></div>' +
					'<ul class="list-group">' +
						'<li style="cursor:pointer;" class="list-group-item" ng-click="toggleVote(p)" ng-class="{\'me\':p.$id==me.player.$id, \'active\':p.$id == me.player.voteFor}" ng-repeat="(name,p) in players">' +
							'<span class="pull-right votes-count" ng-class="{\'text-muted\':countVotes(p)==0}">{{ countVotes(p) }}</span>' +
							//'<button ng-click="toggleVote(p)" ng-disabled="isDead(p)" class="btn btn-default btn-sm pull-left" ng-class="{\'active\': p.$id == me.player.voteFor && isAlive(p), \'btn-danger\': p.$id==me.player.$id}" type="button"><i ng-class="{true:\'icon-thumbs-up\', false:\'icon-ban-circle\'}[isAlive(p)]"></i></button>' +
							' <strong>{{ users[p.user].name }}</strong>' +
							'<span ng-if="p.$id==me.player.$id" class="text-muted"> (vous)</span>' +
							'<br/><small>' +
							'<span ng-if="isDead(p)">est mort</span>' +
							'<span ng-if="isAlive(p) && !p.voteFor">n\'a pas encore voté</span>' +
							'<span ng-if="isAlive(p) && p.voteFor && p.$id == p.voteFor">se suicide...</span>' +
							'<span ng-if="isAlive(p) && p.voteFor && p.$id != p.voteFor"><i class="icon-arrow-right"></i> {{users[game.players[p.voteFor].user].name}}</span>' +
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

				$rootScope.$watch('game.phase', function (phase) {
					if (phase === lgPhase.LOUPS) {
						angular.forEach($rootScope.players, function (player, id) {
							console.log("player ", player, " is ", player.role);
							if (player.team === 'V') {
								scope.players[id] = player;
							}
						});
					}
					else {
						scope.players = $rootScope.players;
					}
				}, true);

				scope.toggleVote = function (player)
				{
					if ($rootScope.isAlive(player)) {
						var me = $rootScope.me.player;
						if (me.voteFor === player.$id) {
							me.voteFor = null;
						}
						else {
							me.voteFor = player.$id;
						}
						$rootScope.players.update(me);
					}
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




	app.directive('lgSoothsayerUi', function (LG)
	{
		return {
			'restrict' : 'A',
			'template' :
				'<div class="panel panel-info">' +
					'<div class="panel-heading"><h4><i class="icon-eye-open"></i> Voyante</h4></div>' +
					'<ul class="list-group">' +
						'<li style="cursor:pointer;" class="list-group-item" ng-click="toggleIdentity(p)" ng-repeat="(name,p) in players">' +
							'<strong>{{ users[p.user].name }}</strong>' +
						'</li>' +
					'</ul>' +
				'</div>',
			scope : true,

			'link' : function (scope)
			{
				scope.identityRevealed = false;
				scope.toggleIdentity = function (player)
				{
					if (! scope.identityRevealed) {
						scope.identityRevealed = true;
						window.alert(player.role);
						LG.nextPhase();
					}
				};
			}
		}
	});



	app.directive('lgWitchUi', function (LG)
	{
		return {
			'restrict' : 'A',
			'template' :
				'<div class="panel panel-info">' +
					'<div class="panel-heading"><h4><i class="icon-beaker"></i> Sorcière</h4></div>' +
					'<ul class="list-group">' +
						'<li class="list-group-item" ng-show="killedPlayer">' +
							'<strong>{{ users[killedPlayer.user].name }} s\'est fait dévorer cette nuit !</strong>' +
							'<div ng-switch="resurrect">' +
								'<button type="button" class="btn btn-block btn-success" ng-class="{\'active\': resurrect}" ng-click="resurrect = ! resurrect">' +
								'<i ng-if="resurrect" class="icon-beaker"></i> ' +
								'Ressuciter {{ users[killedPlayer.user].name }}' +
								'</button>' +
							'</div>' +
						'</li>' +
						'<li class="list-group-item" ng-hide="killedPlayer">' +
							'<span class="label label-primary">Incroyable !</span> <strong>Personne ne s\'est fait dévorer cette nuit !</strong>' +
						'</li>' +
						'<li  class="list-group-item">Tu peux utiliser ta potion de mort pour tuer un autre joueur :</li>' +
						'<li class="list-group-item" ng-repeat="p in players" ng-hide="p.$id == killedPlayer.$id">' +
							'<button type="button" class="btn btn-block btn-danger" ng-class="{\'active\': p.$id == newKilledPlayerId}" ng-click="kill(p)">' +
								'<i ng-if="p.$id == newKilledPlayerId" class="icon-beaker"></i> ' +
								'Tuer <strong>{{ users[p.user].name }}</strong>' +
							'</button>' +
						'</li>' +
					'</ul>' +
					'<div class="panel-footer">' +
						'<p>Lorsque tu as utilisé tes potions comme tu le souhaites, clique sur <strong>Terminer</strong>.</p>' +
						'<button type="button" class="btn btn-default btn-block btn-lg" ng-click="finish()">Terminer</button>' +
					'</div>' +
				'</div>',
			scope : true,

			'link' : function (scope)
			{
				scope.killedPlayer = scope.players.getByName(LG.lastKilledPlayerId());

				scope.resurrect = false;

				scope.newKilledPlayerId = null;

				scope.kill = function (player)
				{
					if (scope.newKilledPlayerId == player.$id) {
						scope.newKilledPlayerId = null;
					}
					else {
						scope.newKilledPlayerId = player.$id;
					}
				};

				scope.finish = function () {
					LG.nextPhase();
				};
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
						'<div class="btn-toolbar">' +
							'<button type="button" ng-if="isNight() && isRoleAlive(\'sorciere\')" class="btn btn-block btn-warning" ng-click="startPhase(\'sorciere\')"><i class="icon-beaker"></i> Sorcière</button>' +
							'<button type="button" ng-if="isNight()" class="btn btn-default" ng-click="beginDay()"><i class="icon-sun"></i> Le jour se lève !</button>' +
							'<button type="button" ng-if="isDay()" class="btn btn-default" ng-click="endDay()"><i class="icon-sun"></i> Terminer la journée</button>' +
							'<button type="button" ng-if="isDay()" class="btn btn-default" ng-click="beginNight()"><i class="icon-moon"></i> La nuit tombe !</button>' +
							'<button type="button" class="btn btn-danger pull-right" ng-click="stopGame()"><i class="icon-stop"></i> Arrêter la partie</button>' +
						'</div>' +
					'</div>' +
					'<div class="panel-footer">' +
					'Phase de jeu : <strong>{{ game.phase }}</strong>' +
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

				scope.endDay = function () {
					LG.endDay();
				};

				scope.beginNight = function () {
					LG.beginNight();
				};
			}
		}
	});



	app.directive('lgTimer', function ($rootScope, $timeout, NIGHT_DURATION) {
		return {
			'restrict' : 'A',
			'template' :
				'<span ng-class="{\'danger\':time <= 30}">{{ time | remainingTime }}<i class="icon-moon"></i></span>',
			'replace'  : true,

			'link' : function (scope)
			{
				var timer;

				function tick () {
					scope.time--;
					if (scope.time === 0) {
						$rootScope.$broadcast('LG:NightIsOver');
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

				$rootScope.$watch('game.phase', function (value, old) {
					if (value === 'loups' && old !== value) {
						scope.time = NIGHT_DURATION + 1;
						stop();
						tick();
					}
					else if (value === 'villageois') {
						stop();
					}
				}, true);
			}
		}
	});


})(moment);