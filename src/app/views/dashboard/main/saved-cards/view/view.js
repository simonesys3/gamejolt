angular.module( 'App.Views' ).config( function( $stateProvider )
{
	$stateProvider.state( 'dashboard.main.saved-cards.view', {
		url: '/view/:id',
		controller: 'Dashboard.Main.SavedCards.ViewCtrl',
		controllerAs: 'viewCtrl',
		templateUrl: '/app/views/dashboard/main/cards/view/view.html',
		resolve: {
			payload: function( $stateParams, Api )
			{
				return Api.sendRequest( '/web/dash/cards/' + $stateParams.id );
			}
		}
	} );
} );
