(function() {

	"use strict";

	angular.module("LoupsGarous").service('lgCharacters', function (lgTeam) {

		var characters = [
			{
				'id' : 'loup',
				'name' : 'loup',
				'desc' : 'Chaque nuit, vous votez pour dévorer un villageois. Le jour, vous masquez votre identité pour échapper à la vindicte populaire. Vous gagnez si tous les villageois sont tués.',
				'team' : lgTeam.LOUPS,
				'multiple' : true
			},
			{
				'id' : 'villageois',
				'name' : 'villageois',
				'desc' : "Vous n'avez pas de pouvoir particulier. Survivez aux loups pour remporter la victoire !",
				'team' : lgTeam.VILLAGEOIS,
				'multiple' : true
			},
			{
				'id' : 'sorciere',
				'name' : 'sorcière',
				'desc' : "Vous disposez de deux potions magiques : une potion de vie pour ressuciter un joueur tué par les loups-garous, et une potion de mort pour éliminer un joueur. Survivez aux loups pour remporter la victoire !",
				'team' : lgTeam.VILLAGEOIS,
				'multiple' : false,
				'phase' : 'sorciere'
			},
			{
				'id' : 'voyante',
				'name' : 'voyante',
				'desc' : "Chaque nuit, vous aurez l'occasion de découvrir l'identité d'un joueur de votre choix. Survivez aux loups pour remporter la victoire !",
				'team' : lgTeam.VILLAGEOIS,
				'multiple' : false,
				'phase' : 'voyante'
			}/*,
			{
				'id' : 'cupidon',
				'name' : 'Cupidon',
				'desc' : "Lors de la première nuit, vous désignez deux joueurs qui tombent amoureux l'un de l'autre. Lorsque l'un d'eux meurt, l'autre meurt de chagrin.",
				'team' : lgTeam.VILLAGEOIS,
				'multiple' : false,
				'phase' : 'cupidon'
			}*/
		];

		var byId = {};
		for (var i=0 ; i<characters.length ; i++) {
			byId[characters[i].id] = characters[i];
		}

		// Public API

		return {

			characters : characters,

			characterById : function (id) {
				return byId[id];
			},

			SORCIERE : 'sorciere',
			VILLAGEOIS : 'villageois',
			LOUP : 'loup',
			VOYANTE : 'voyante',
			CUPIDON : 'cupidon'

		};

	});

})();