angular.module( 'App.Views' ).config( function( $stateProvider )
{
	$stateProvider.state( 'dashboard.developer.games.manage.linked-key-pools', {
		abstract: true,
		url: '/keys/linked-key-pools',
		templateUrl: '/app/views/dashboard/developer/games/manage/linked-key-pools/linked-key-pools.html',
	} );
} );
