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
					'<img style="width:40px;height:40px;" ng-src="images/avatars/{{ sender.avatar }}">' +
				'</a>' +
				'<div ng-if="!sameSender">' +
					'<small class="pull-right text-muted"><time lg-time-ago="message.date"></time></small>' +
					'<strong ng-if="! systemMessage">{{ sender.name }}</strong>' +
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
							else if (! msg.dead && (!msg.phase || msg.sender === 'system' || msg.phase === lgPhase.VILLAGEOIS || ($rootScope.me && msg.team === $rootScope.me.player.team))) {
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
					var height = $(window).height() - chatView.offset().top - 100;
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





	app.directive('lgCharactersSelectionUi', function (lgCharacters)
	{
		return {
			'restrict' : 'A',
			'templateUrl' : 'lgCharactersSelectionUi.html',
			'require' : 'ngModel',

			'link' : function (scope, iElement, iAttrs, ngModel)
			{
				var selected = {
					'count' : 0,
					'chars' : []
				};
				scope.characters = lgCharacters.characters;

				scope.select = function (char)
				{
					if (char.multiple) {
						if (! char.count) {
							char.count = 1;
						}
						else {
							char.count++;
						}
					}
					else {
						char.count = 1;
					}
				};

				scope.remove = function (char)
				{
					char.count--;
				};

				scope.$watch('characters', function (chars, old)
				{
					selected.count = 0;
					selected.chars.length = 0;
					// TODO Attention si d'autres équipes voient le jour !
					selected.LCount = 0;
					selected.VCount = 0;
					angular.forEach(chars, function (char) {
						if (char.count) {
							selected.chars.push(char);
							selected.count += char.count;
							selected[char.team+'Count'] = (selected[char.team+'Count'] || 0) + 1;
						}
					});
					console.log(selected);
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
				'<div class="panel panel-default">' +
					'<div class="panel-heading" ng-click="showDesc = ! showDesc" style="cursor: pointer;">' +
						'<h4>' +
							'<img class="card small pull-right" ng-src="images/cartes/{{ character.id }}.png"/> ' +
							'{{ character.name }}' +
						'</h4>' +
					'</div>' +
					'<div class="panel-body" ng-if="showDesc">{{ character.desc }}</div>' +
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
						'<li class="list-group-item">Cliquez sur le nom d\'un joueur pour réléver son identité :</li>' +
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



	app.directive('lgWitchUi', function (LG, $rootScope, $timeout)
	{
		return {
			'restrict' : 'A',
			'template' :
				'<div class="panel panel-info">' +
					'<div class="panel-heading"><h4><i class="icon-beaker"></i> Sorcière</h4></div>' +
					'<ul class="list-group">' +
						'<li class="list-group-item" ng-if="killedPlayer">' +
							'<div ng-if="me.player.lifePotionUsed">Tu as déjà utilisé ta potion de vie.</div>' +
							'<div ng-if="! me.player.lifePotionUsed">' +
								'<strong>{{ users[killedPlayer.user].name }} s\'est fait dévorer cette nuit !</strong>' +
								'<div ng-switch="resurrect">' +
									'<button type="button" class="btn btn-block btn-default btn-sm" ng-class="{\'btn-success active\': resurrect}" ng-click="resurrect = ! resurrect">' +
									'<i ng-if="resurrect" class="icon-beaker"></i> ' +
									'Ressuciter {{ users[killedPlayer.user].name }}' +
									'</button>' +
								'</div>' +
							'</div>' +
						'</li>' +

						'<li class="list-group-item" ng-hide="killedPlayer">' +
							'<span class="label label-primary">Incroyable !</span> <strong>Personne ne s\'est fait dévorer cette nuit !</strong>' +
						'</li>' +

						'<li class="list-group-item" ng-if="! me.player.deathPotionUsed"><p>Tu peux utiliser ta potion de mort pour tuer un autre joueur :</p>' +
							'<button type="button" ng-repeat="p in players" ng-hide="p.$id == killedPlayer.$id" class="btn btn-default btn-block btn-sm" ng-class="{\'btn-danger active\': p.$id == newKilledPlayerId}" ng-click="kill(p)">' +
								'<i ng-if="p.$id == newKilledPlayerId" class="icon-beaker"></i> ' +
								'Tuer <strong>{{ users[p.user].name }}</strong>' +
							'</button>' +
						'</li>' +
						'<li class="list-group-item" ng-if="me.player.deathPotionUsed"><strong>Tu as déjà utilisé ta potion de mort.</strong></li>' +

					'</ul>' +
					'<div class="panel-footer" ng-switch="(! killedPlayer || me.player.lifePotionUsed) && me.player.deathPotionUsed">' +
						'<p ng-switch-when="true">Tu ne peux utiliser aucune potion. Clique sur <strong>Terminer</strong>.</p>' +
						'<p ng-switch-when="false">Lorsque tu as utilisé tes potions comme tu le souhaites, clique sur <strong>Terminer</strong>.</p>' +
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


				scope.finish = function ()
				{
					$rootScope.me.player.lifePotionUsed = scope.resurrect;
					$rootScope.me.player.deathPotionUsed = scope.newKilledPlayerId;
					$timeout(function () {
						LG.endWitchPhase($rootScope.me.player, scope.resurrect, scope.newKilledPlayerId);
					})
				};
			}
		}
	});



	app.directive('lgGameMasterUi', function (LG, $rootScope) {
		return {
			'restrict' : 'A',
			'templateUrl' : 'lgGameMasterUi.html',
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


				scope.gameData = {};

				// Actions
				scope.createGame = function () {
					$rootScope.game.status = 'WAITING';
				};

				scope.joinGame = LG.joinGame;
				scope.prepareGame = LG.prepareGame;
				scope.cancelGame = LG.cancelGame;
				scope.stopGame = LG.stopGame;

				scope.beginGame = function () {
					LG.beginGame(scope.gameData.selectedChars);
				};

			}
		}
	});



	app.directive('lgTimer', function ($rootScope, $timeout, NIGHT_DURATION) {
		return {
			'restrict' : 'A',
			'template' :
				'<span ng-class="{\'danger\':time <= 30}">{{ time | remainingTime }}</span>',
			'replace'  : true,

			'link' : function (scope, iElement)
			{
				var timer;
				iElement.hide();

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
						iElement.show();
						tick();
					}
					else if (value === 'villageois') {
						stop();
						iElement.hide();
					}
				}, true);
			}
		}
	});



	app.directive('lgCharactersInGame', function (LG, lgCharacters, $rootScope)
	{
		return {
			'restrict' : 'A',
			'template' :
				'<div class="panel panel-default" ng-if="game.status == \'RUNNING\'">' +
					'<div class="panel-heading"><h4>En jeu</h4></div>' +
					'<table class="table">' +
						'<tr ng-repeat="(name,count) in countPerRole" ng-class="{true:\'alive\', false:\'dead\'}[count.alive > 0]">' +
							'<td align="right">{{ name }}</td><td ng-switch="count.multiple">' +
								'<span ng-switch-when="true">{{ count.alive }}<span class="text-muted"> ({{ count.total }})</span></span>' +
								'<span ng-switch-when="false">{{ count.alive }}</span>' +
							'</td>' +
						'</tr>' +
					'</table>' +
				'</div>',
			scope : true,

			'link' : function (scope, iElement, iAttrs)
			{
				scope.countPerRole = {};
				angular.forEach($rootScope.players, function (p)
				{
					var char = lgCharacters.characterById(p.role);
					if (! char) return;
					if (! scope.countPerRole.hasOwnProperty(char.name)) {
						scope.countPerRole[char.name] = {
							alive : LG.isAlive(p) ? 1 : 0,
							total : 1,
							multiple : char.multiple
						};
					}
					else {
						if (LG.isAlive(p)) {
							scope.countPerRole[char.name].alive++;
						}
						scope.countPerRole[char.name].total++;
					}
				});
			}
		}
	});



})(moment);