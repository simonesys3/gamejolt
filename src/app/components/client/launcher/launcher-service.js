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
		// Reattach all running games after a restart.
		_.forEach( Client_Library.packages, function( localPackage )
		{
			if ( localPackage.isRunning() ) {
				_this.reattach( localPackage );
			}
		} );

		_this.isLoaded = true;
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
				_this.clear( localPackage );
				console.error( e );
				Growls.error( 'Could not launch game.' );
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
				_this.clear( localPackage );
			} );
	};

	this.attach = function( localPackage, launchInstance )
	{
		this.currentlyPlaying.push( localPackage );

		launchInstance.on( 'gameOver', function()
		{
			_this.clear( localPackage );
		} );

		$rootScope.$emit( 'Client_Launcher.gameLaunched', this.currentlyPlaying.length );

		return localPackage.$setRunningPid( launchInstance.pid );
	};

	this.clear = function( localPackage )
	{
		var removedItems = _.remove( this.currentlyPlaying, { id: localPackage.id } );
		localPackage.$clearRunningPid();
		if ( removedItems.length ) {
			$rootScope.$emit( 'Client_Launcher.gameClosed', this.currentlyPlaying.length );
		}
	};
} );
