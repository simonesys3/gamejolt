angular.module( 'App.Views' ).config( function( $stateProvider )
{
	$stateProvider.state( 'dashboard.main.saved-cards', {
		abstract: true,
		url: '/saved-cards',
		template: '<ui-view></ui-view>',
	} );
} );
