(function() {

	"use strict";

	angular.module("LoupsGarous").service('lgCharacters', function () {

		var characters = [
			{
				'id' : 'loup',
				'name' : 'loup',
				'desc' : 'Chaque nuit, vous votez pour dévorer un villageois. Le jour, vous masquez votre identité pour échapper à la vindicte populaire. Vous gagnez si tous les villageois sont tués.',
				'team' : 'L',
				'multiple' : true
			},
			{
				'id' : 'villageois',
				'name' : 'villageois',
				'desc' : "Vous n'avez pas de pouvoir particulier. Survivez aux loups pour remporter la victoire !",
				'team' : 'V',
				'multiple' : true
			},
			{
				'id' : 'sorciere',
				'name' : 'sorcière',
				'desc' : "Vous disposez de deux potions magiques : une potion de vie pour ressuciter un joueur tué par les loups-garous, et une potion de mort pour éliminer un joueur. Survivez aux loups pour remporter la victoire !",
				'team' : 'V',
				'multiple' : false,
				'phase' : 'sorciere'
			},
			{
				'id' : 'voyante',
				'name' : 'voyante',
				'desc' : "Chaque nuit, vous aurez l'occasion de découvrir l'identité d'un joueur de votre choix. Survivez aux loups pour remporter la victoire !",
				'team' : 'V',
				'multiple' : false,
				'phase' : 'voyante'
			}
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
			}

		};

	});

})();