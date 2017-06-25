/**
 * Can't be in angular-land since we need to make sure it can update even if we push a broken client out.
 */
(function()
{
	var Updater = require( 'nwjs-snappy-updater' ).Updater;
	var path = require( 'path' );
	var Application = require( 'client-voodoo' ).Config;

	var CHECK_ENDPOINT = 'http://d.gamejolt.net/data/client/manifest-2.json';
	var CHECK_INTERVAL = 15 * 60 * 1000; // 15min currently

	function Client_Updater()
	{
		var _this = this;

		this.check();
		window.setInterval( function()
		{
			_this.check();
		}, CHECK_INTERVAL );
	}

	Client_Updater.prototype.check = function()
	{
		console.log( 'Checking for client update.' );

		var os = require( 'os' );
		var packageJson;

		// Mac exec path looks like:
		// root/blah.app/Contents/Frameworks/nwjs Helper.app/Contents/MacOS/nwjs
		// The other OSes are just the root dir.
		var cwd = path.dirname( process.execPath );
		if ( os.type() == 'Darwin' ) {
			cwd = path.resolve( cwd, '../../../../Resources/app.nw' )
		}
		packageJson = require( path.join( cwd, 'package.json' ) );

		if ( packageJson['no-auto-update'] === true ) {
			console.log( 'Skip update. Package says not to auto-update.' );
			return;
		}

		var updater = new Updater( packageJson.version, CHECK_ENDPOINT );

		return updater.cleanup()
			.then( function()
			{
				return updater.check()
			} )
			.then( function( hasNew )
			{
				if ( !hasNew ) {
					console.log( 'Client is up to date.' );
					return;
				}

				console.log( 'New version of client. Updating...' );

				// If we're on windows, we need to make sure to release the mutex we have on it.
				// This is so we can clean up the node_modules folder without the mutex binding being in use by the fs.
				return Application.releaseClientMutex()
					.catch( function( err )
					{
						// We should never fail here, we don't want to risk aborting an update because mutex isn't released correctly.
						// This ensures that even if theres a problem with the mutex we'll at least start fetching the next update.
						console.error( err );
						return;
					} )
					.then( function()
					{
						return updater.update();
					} )
					.then( function( wasUpdated )
					{
						if ( !wasUpdated ) {
							console.log( 'Update aborted.' );
							return;
						}

						console.log( 'Updated! Reloading...' );
						var gui = require( 'nw.gui' );
						var win = gui.Window.get();
						win.reloadDev();
					} );
			} )
			.catch( function( err )
			{
				console.log( err );
			} );
	};

	var clientUpdater = new Client_Updater();
})();
