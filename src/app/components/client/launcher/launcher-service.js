angular.module( 'App.Client.Launcher' )
.run( function( $rootScope, Client_Launcher )
{
	$rootScope.$on( 'Client_Library.watchersSet', function()
	{
		Client_Launcher.init();
	} );
} )
.service( 'Client_Launcher', function( $q, $rootScope, Client_Library, Api, Device, Growls )
{
	var _this = this;

	this.isLoaded = false;
	this.currentlyPlaying = [];

	this.init = function()
	{
		var gui = require( 'nw.gui' );
		var Application = require( 'client-voodoo' ).Config;
		var path = require( 'path' );
		var pidDir = path.resolve( gui.App.dataPath, 'game-pids' );
		Application.setPidDir( pidDir );

		$q.when( Application.ensurePidDir() )
			.then( function()
			{
				// Get all running packages by looking at the old launcher's game pid directory.
				// This finds games that were started outside the client as well.
				var runningPackageIds = require( 'fs' ).readdirSync( pidDir ).map( function( filename )
				{
					// Pid files are named after the package ids they are currently running.
					try {
						return parseInt( path.basename( filename ) );
					}
					catch ( err ) {
						return false;
					}
				} ).filter( function( packageId ) { return !!packageId } );

				console.log( 'Running package ids by game pid file: [' + runningPackageIds.join( ',' ) + ']' );

				// For all the packages that have a game pid file and aren't marked as running in the localdb - mark as running before attaching.
				// This will mark them as runnig using the old client launcher's running format.
				var markedAsRunning = [];
				angular.forEach( runningPackageIds, function( runningPackageId )
				{
					var localPackage = Client_Library.packages[ runningPackageId ];
					if ( localPackage && !localPackage.isRunning() ) {
						markedAsRunning.push( localPackage.$setRunningPid( {
							wrapperId: localPackage.id.toString(),
						} ) );
					}
				} );

				return $q.all( markedAsRunning );
			} )
			.then( function()
			{
				// Reattach all running games after a restart.
				var reattachingPromises = [];
				_.forEach( Client_Library.packages, function( localPackage )
				{
					if ( localPackage.isRunning() ) {
						var reattach = _this.reattach( localPackage )
							.catch( function( err )
							{
								// We catch here to make sure failing reattachment doesn't make Promise.all return early.
								// This is because we need all attachment operations to complete reliably before starting the migration.
								return null;
							} );

						reattachingPromises.push( reattach );
					}
				} );

				// We only mark the launcher as loaded once it at least finished reattaching to the currently running instances.
				// This is so that the migrator can check when the packages are no longer running.
				return $q.all( reattachingPromises );
			} )
			.then( function()
			{
				console.log( 'Launcher loaded and ready' );
				_this.isLoaded = true;
			} );

		// _this.isLoaded = true;
	};

	this.getRunningPackageIds = function()
	{
		return _.pluck( _this.currentlyPlaying, 'id' );
	};

	this.launch = function( localPackage )
	{
		var Launcher = require( 'client-voodoo' ).Launcher;
		var os = Device.os();
		var arch = Device.arch();

		return $q.when( localPackage.$setLaunching() )
			.then( function()
			{
				return Api.sendRequest( '/web/dash/token/get-for-game', { game_id: localPackage.game_id } );
			} )
			.catch( function( e )
			{
				console.log( 'Could not get game token to launch with - launching anyways' );
				console.error( e );
				return null;
			} )
			.then( function( payload )
			{
				var credentials = (payload && payload.username && payload.token)
					? { username: payload.username, user_token: payload.token }
					: null;

				// return Launcher.launch( localPackage, os, arch, credentials ).promise;
				return Launcher.launch( localPackage, credentials );
			} )
			.then( function( launchInstance )
			{
				return _this.attach( localPackage, launchInstance );
			} )
			.catch( function( e )
			{
				console.error( e );
				Growls.error( 'Could not launch game.' );
				return _this.clear( localPackage );
			} );
	};

	this.reattach = function( localPackage )
	{
		var Launcher = require( 'client-voodoo' ).Launcher;

		return $q.when( Launcher.attach( localPackage.running_pid ) )
			.then( function( launchInstance )
			{
				return _this.attach( localPackage, launchInstance );
			} )
			.catch( function( e )
			{
				console.log( 'Could not reattach launcher instance', localPackage.running_pid );
				console.error( e );
				return $rootScope.$apply( function()
				{
					return _this.clear( localPackage );
				} );
			} );
	};

	this.attach = function( localPackage, launchInstance )
	{
		this.currentlyPlaying.push( localPackage );

		launchInstance.on( 'gameOver', function()
		{
			$rootScope.$apply( function()
			{
				_this.clear( localPackage );
			} );
		} );

		$rootScope.$emit( 'Client_Launcher.gameLaunched', this.currentlyPlaying.length );

		return localPackage.$setRunningPid( launchInstance.pid );
	};

	this.clear = function( localPackage )
	{
		var removedItems = _.remove( this.currentlyPlaying, { id: localPackage.id } );
		if ( removedItems.length ) {
			$rootScope.$emit( 'Client_Launcher.gameClosed', this.currentlyPlaying.length );
		}

		return localPackage.$clearRunningPid();
	};
} );
