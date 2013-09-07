(function() {

	"use strict";

	angular.module("LoupsGarous").service('lgCharacters', function () {

		var characters = [
			{
				'id' : 'loup',
				'name' : 'loup',
				'desc' : 'Chaque nuit, vous votez pour dévorer un villageois. Le jour, vous masquer votre identité pour échapper à la vindicte populaire. Vous gagnez si tous les villageois sont tués.',
				'type' : 'L',
				'multiple' : true
			},
			{
				'id' : 'vill',
				'name' : 'villageois',
				'desc' : "Vous n'avez pas de pouvoir particulier. Survivez aux loups pour remporter la victoire !",
				'type' : 'V',
				'multiple' : true
			},
			{
				'id' : 'sorc',
				'name' : 'sorcière',
				'desc' : "Vous disposez de deux potions magiques : une potion de vie pour ressuciter un joueur tué par les loups-garous, et une potion de mort pour éliminer un joueur. Survivez aux loups pour remporter la victoire !",
				'type' : 'V',
				'multiple' : false
			},
			{
				'id' : 'voya',
				'name' : 'voyante',
				'desc' : "Chaque nuit, vous aurez l'occasion de découvrir l'identité d'un joueur de votre choix. Survivez aux loups pour remporter la victoire !",
				'type' : 'V',
				'multiple' : false
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