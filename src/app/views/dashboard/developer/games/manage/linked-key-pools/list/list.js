angular.module( 'App.Views' ).config( function( $stateProvider )
{
	$stateProvider.state( 'dashboard.developer.games.manage.linked-key-pools.list', {
		url: '',
		controller: 'Dashboard.Developer.Games.Manage.LinkedKeyPools.ListCtrl',
		controllerAs: 'listCtrl',
		templateUrl: '/app/views/dashboard/developer/games/manage/linked-key-pools/list/list.html',
		resolve: {
			payload: function( $stateParams, Api )
			{
				return Api.sendRequest( '/web/dash/developer/games/linked-key-pools/' + $stateParams.id );
			},
		}
	} );
} );
