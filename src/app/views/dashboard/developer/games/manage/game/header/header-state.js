angular.module( 'App.Views' ).config( function( $stateProvider )
{
	$stateProvider.state( 'dashboard.developer.games.manage.game.header', {
		url: '/header',
		controller: 'Dashboard.Developer.Games.Manage.Game.HeaderCtrl',
		controllerAs: 'headerCtrl',
		templateUrl: require( './header.html' ),
	} );
} );
