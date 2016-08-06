angular.module( 'App.Views' ).config( function( $stateProvider, $urlMatcherFactoryProvider, $urlRouterProvider )
{
	$stateProvider.state( 'discover.devlogs.list._fetch', {
		url: '/{section:hot|best|new}?query&page',
		controller: 'Discover.Devlogs.List._FetchCtrl',
		templateUrl: '/app/views/discover/devlogs/list/_fetch.html',
		resolve: {
			payload: function( $state, $stateParams, Api, filteringContainer )
			{
				return filteringContainer.init( 'discover.devlogs.list._fetch', $stateParams )
					.then( function()
					{
						var query = filteringContainer.getQueryString( $stateParams );
						return Api.sendRequest( '/web/discover/devlogs/games?' + query );
					} );
			}
		}
	} );
} );
