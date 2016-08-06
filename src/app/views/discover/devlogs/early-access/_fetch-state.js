angular.module( 'App.Views' ).config( function( $stateProvider, $urlMatcherFactoryProvider, $urlRouterProvider )
{
	$stateProvider.state( 'discover.devlogs.early-access._fetch', {
		url: '/early-access/:section?query&page',
		params: {
			section: {
				value: 'hot',
				squash: true,
			},
		},
		controller: 'Discover.Devlogs.EarlyAccess._FetchCtrl',
		templateUrl: '/app/views/discover/devlogs/early-access/_fetch.html',
		resolve: {
			payload: function( $state, $stateParams, Api, filteringContainer )
			{
				return filteringContainer.init( 'discover.devlogs.early-access._fetch', $stateParams )
					.then( function()
					{
						var query = filteringContainer.getQueryString( $stateParams );
						return Api.sendRequest( '/web/discover/devlogs/games?' + query );
					} );
			}
		}
	} );
} );
