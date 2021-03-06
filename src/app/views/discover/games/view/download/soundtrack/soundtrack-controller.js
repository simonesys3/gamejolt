angular.module( 'App.Views' ).controller( 'Discover.Games.View.Download.SoundtrackCtrl', function(
	$scope, $sce, $window, $timeout, App, Game_Song, Scroll, gettextCatalog )
{
	var _this = this;

	App.title = gettextCatalog.getString( 'game.download.soundtrack.page_title', { game: $scope.gameCtrl.game.title } );

	this.src = undefined;

	// If they click away from the page before the download starts, then cancel the download redirect.
	var shouldDownload = true;
	var downloadPromise = $timeout( 5000 )
		.then( function()
		{
			return Game_Song.getSoundtrackDownloadUrl( $scope.gameCtrl.game.id );
		} )
		.then( function( response )
		{
			if ( shouldDownload ) {
				_this.src = $sce.trustAsResourceUrl( response.downloadUrl );
			}

			downloadPromise = null;
		} );

	$scope.$on( '$stateChangeStart', function()
	{
		shouldDownload = false;
	} );

	window.setTimeout( function()
	{
		Scroll.to( 'page-ad-scroll' );
	}, 0 );
} );
