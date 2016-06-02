angular.module( 'App.Views' ).config( function( $stateProvider )
{
	$stateProvider.state( 'dashboard.developer.games.manage.linked-key-pools.edit', {
		url: '/edit/{linkedKeyPoolId:int}',
		controller: 'Dashboard.Developer.Games.Manage.LinkedKeyPools.EditCtrl',
		controllerAs: 'editCtrl',
		templateUrl: '/app/views/dashboard/developer/games/manage/linked-key-pools/edit/edit.html',
		resolve: {
			payload: function( $stateParams, Api )
			{
				return Api.sendRequest( '/web/dash/developer/games/linked-key-pools/' + $stateParams.id + '/' + $stateParams.linkedKeyPoolId );
			},
		}
	} );
} );
