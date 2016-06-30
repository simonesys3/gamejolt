angular.module( 'App.Views' ).config( function( $stateProvider )
{
	$stateProvider.state( 'dashboard.main.saved-cards.list', {
		url: '',
		controller: 'Dashboard.Main.SavedCards.ListCtrl',
		controllerAs: 'listCtrl',
		templateUrl: '/app/views/dashboard/main/saved-cards/list/list.html',
		resolve: {
			payload: function( Api )
			{
				return Api.sendRequest( '/web/dash/saved-cards' );
			}
		}
	} );
} );
