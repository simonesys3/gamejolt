angular.module( 'App.Client.Installer' )
.run( function( $rootScope, Client_Installer )
{
	$rootScope.$on( 'Client_Library.watchersSet', function()
	{
		Client_Installer.init();
	} );
} )
.service( 'Client_Installer', function( $q, $rootScope, Api, Client, Client_Library, Settings, LocalDb, LocalDb_Package, Growls )
{
	var _this = this;

	this.currentlyPatching = {};
	this.numPatching = 0;

	this.init = function()
	{
		// Make sure we pull in the queue settings.
		this.checkQueueSettings();

		// TODO: call retryAllInstalls or always call it through the migrator?

		// We set the system progress bar as we patch.
		// Should be the accumulation of all current patches ongoing.
		$rootScope.$watch( function()
		{
			if ( !_this.numPatching ) {
				return null;
			}

			var currentProgress = 0;
			angular.forEach( _this.currentlyPatching, function( handle, packageId )
			{
				currentProgress += _this.getPackagePatchProgress( packageId ) || 0;
			} );
			return currentProgress / _this.numPatching;
		},
		function( progress )
		{
			if ( progress === null ) {
				Client.clearProgressBar();
				return;
			}

			Client.setProgressBar( progress );
		} );
	};

	this.retryAllInstalls = function()
	{
		// This will retry to install anything that was installing before client was closed.
		angular.forEach( Client_Library.packages, function( localPackage )
		{
			if ( localPackage.isPatching() && !localPackage.isPatchPaused() ) {
				_this.retryInstall( localPackage );
			}
		} );
	};

	this.getPackagePatchProgress = function( packageId )
	{
		var _package = Client_Library.packages[ packageId ];
		if ( !_package ) {
			return null;
		}

		if ( Client_Library.packages[ packageId ].download_progress ) {
			return Client_Library.packages[ packageId ].download_progress.progress;
		}
		else if ( Client_Library.packages[ packageId ].unpack_progress ) {
			return Client_Library.packages[ packageId ].unpack_progress.progress;
		}

		return null;
	};

	this.checkQueueSettings = function()
	{
		var Queue = require( 'client-voodoo' ).Queue;

		Queue.faster = {
			downloads: Settings.get( 'max-download-count' ),
			extractions: Settings.get( 'max-extract-count' ),
		};

		if ( Settings.get( 'queue-when-playing' ) ) {
			Queue.slower = {
				downloads: 0,
				extractions: 0,
			};
		}
		else {
			Queue.slower = Queue.faster;
		}
	};

	this.retryInstall = function( localPackage )
	{
		// Reset states.
		var downloadStates = [
			LocalDb_Package.DOWNLOADING,
			LocalDb_Package.DOWNLOAD_FAILED,
		];

		var unpackStates = [
			LocalDb_Package.UNPACKING,
			LocalDb_Package.UNPACK_FAILED,
		];

		var promise = $q.resolve();
		if ( downloadStates.indexOf( localPackage.install_state ) != -1 ) {
			promise = localPackage.$setInstallState( LocalDb_Package.PATCH_PENDING );
		}
		else if ( unpackStates.indexOf( localPackage.install_state ) != -1 ) {
			promise = localPackage.$setInstallState( LocalDb_Package.DOWNLOADED );
		}
		else if ( downloadStates.indexOf( localPackage.update_state ) != -1 ) {
			promise = localPackage.$setUpdateState( LocalDb_Package.PATCH_PENDING );
		}
		else if ( unpackStates.indexOf( localPackage.update_state ) != -1 ) {
			promise = localPackage.$setUpdateState( LocalDb_Package.DOWNLOADED );
		}

		return promise.then( function()
		{
			var game = Client_Library.games[ localPackage.game_id ];
			_this.install( game, localPackage );
		} );
	};

	this._getAccessToken = function( packageId )
	{
		return Api.sendRequest( '/updater/get-access-token/' + packageId, null, { apiPath: '/x', processPayload: false, detach: true } )
			.then( function( result )
			{
				if ( !result || !result.data || !result.data.token ) {
					throw new Error( 'Result is empty' );
				}

				return result.data.token;
			} )
	};

	this.install = function( game, localPackage )
	{
		var authToken;
		var packageId = localPackage.id;
		var _this = this;
		var authTokenGetter = function()
		{
			return _this._getAccessToken( packageId );
		};

		var promise = authTokenGetter()
			.catch( function( e )
			{
				console.log( 'Could not get access token for package ' + localPackage.id );
				console.error( e );
				return '';
			} )
			.then( function( _authToken )
			{
				authToken = _authToken;
			} );

		// We freeze the installation directory in time.
		if ( !localPackage.install_dir ) {
			var path = require( 'path' );
			promise = promise.then( function()
			{
				return localPackage.$setInstallDir( path.join(
					Settings.get( 'game-install-dir' ),
					game.slug + '-' + game.id,
					(localPackage.name || 'default') + '-' + localPackage.id
				) );
			} );
		}

		// If we were paused before, let's resume.
		// This happens if they paused, then restarted client. The patch would still be paused
		// but if they click resume we want to start a new install again.
		if ( localPackage.isPatchPaused() ) {
			promise = promise.then( function()
			{
				return localPackage.$setPatchResumed();
			} );
		}

		var operation = localPackage.install_state ? 'install' : 'update';
		var packageTitle = (localPackage.title || game.title);
		if ( packageTitle != game.title ) {
			packageTitle += ' for ' + game.title;
		}

		var patchInstance = null;
		return promise
			.then( function()
			{
				var Patcher = require( 'client-voodoo' ).Patcher;
				return Patcher.patch( localPackage, authTokenGetter, { authToken: authToken } );
			} )
			.then( function( patchInstance )
			{
				return $q( function( resolve, reject )
				{
					_this._startPatching( localPackage, patchInstance );

					var listeners = {};
					function cleanupListeners()
					{
						// Remove all listeners we bound to patch instance so it won't update the local package after the operation is done.
						for ( var event in listeners ) {
							patchInstance.removeListener( event, listeners[event] );
						}
						listeners = {};
					}

					patchInstance
						.on( 'state', listeners['state'] = function( state )
						{
							switch ( state ) {

								// Downloading
								case 1:
									return $rootScope.$apply( function()
									{
										if ( localPackage.install_state ) {
											localPackage.$setInstallState( LocalDb_Package.DOWNLOADING );
										}
										else if ( localPackage.update_state ) {
											localPackage.$setUpdateState( LocalDb_Package.DOWNLOADING );
										}
									} );

								// Patching
								case 2:
									return $rootScope.$apply( function()
									{
										// No longer needed.
										delete localPackage.download_progress;

										if ( localPackage.install_state ) {
											localPackage.$setInstallState( LocalDb_Package.UNPACKING );
										}
										else if ( localPackage.update_state ) {
											localPackage.$setUpdateState( LocalDb_Package.UNPACKING );
										}
									} );
							}
						} )
						.on( 'progress', listeners['progress'] = function( progress )
						{
							var progressType = progress.type;

							progress = {
								// Newer version of client voodoo return progress as an integer between 0-100,
								// but old client-voodoo returned a float between 0-1.
								// To maintain compatibility, make this function return the float always.
								progress: progress.percent / 100,

								timeLeft: Math.round( ( progress.total - progress.current ) / progress.sample.movingAverage ),

								// divide by 1024 to convert to kbps
								rate: Math.round( progress.sample.movingAverage / 1024 ),
							};

							$rootScope.$apply( function()
							{
								if ( progressType == 'download' ) {
									localPackage.download_progress = progress;
								}
								else {
									localPackage.unpack_progress = progress;
								}
								localPackage.$save();
							} );
						} )
						.on( 'paused', listeners['paused'] = function( queued )
						{
							console.log( 'Pause received in gamejolt repo. From queue: ' + ( queued ? 'yes' : 'no' ) );

							$rootScope.$apply( function()
							{
								if ( queued ) {
									localPackage.$setPatchQueued();
								}
								else {
									localPackage.$setPatchPaused();
								}
							} );
						} )
						.on( 'resumed', listeners['resumed'] = function( unqueued )
						{
							console.log( 'Resume received in gamejolt repo. From queue: ' + ( unqueued ? 'yes' : 'no' ) );

							$rootScope.$apply( function()
							{
								if ( unqueued ) {
									localPackage.$setPatchUnqueued();
								}
								else {
									localPackage.$setPatchResumed();
								}
							} );
						} )
						.on( 'updateFailed', listeners['updateFailed'] = function( reason )
						{
							cleanupListeners();

							// If the update was canceled the 'context canceled' will be emitted as the updateFailed reason.
							if ( reason == 'context canceled' ) {
								return resolve( true );
							}
							reject( new Error( reason ) );
						} )
						.on( 'updateFinished', listeners['updateFinished'] = function()
						{
							cleanupListeners();
							resolve( false );
						} )
						.on( 'fatal', listeners['fatal'] = function( err )
						{
							cleanupListeners();

							console.log( 'Received fatal error in patcher in gamejolt repo: ' + err.message );
							reject( err );
						} );
				} );
			} )
			.then( function( canceled )
			{
				_this._stopPatching( localPackage );

				if ( !canceled ) {
					var installPromise = $q.resolve();
					if ( localPackage.install_state ) {
						installPromise = localPackage.$setInstalled();
					}
					else if ( localPackage.update_state ) {
						installPromise = localPackage.$setUpdated();
					}

					return installPromise
						.then( function()
						{
							var action = operation == 'install' ? 'finished installing' : 'updated to the latest version';
							var title = operation == 'install' ? 'Game Installed' : 'Game Updated';
							Growls.add( 'success', packageTitle + ' has ' + action + '.', title );
						} );
				}
				else {
					console.log( 'Canceling installation' );
					console.log( localPackage );
					console.log( localPackage.install_state );

					// If we were cancelling the first installation - we have to treat the package as uninstalled.
					if ( operation === 'install' ) {
						console.log( 'Canceled a first installation, Marking as uninstalled from db' );

						// Calling $uninstall normally attempts to spawn a client voodoo uninstall instance.
						// Override that because the uninstallation should be done automatically by the installation process.
						return localPackage.$uninstall( true );
					}
					else {
						console.log( 'Canceled an update operation. Attempting to rollback.' );
						var Rollbacker = require( 'client-voodoo' ).Rollbacker;
						return $q( function( resolve, reject )
						{
							Rollbacker.rollback( localPackage )
								.then( function( rollbackInstance )
								{
									rollbackInstance
										.on( 'rollbackFailed', function( reason )
										{
											console.log( 'Received rollbackFailed in gamejolt: ' + reason );
											reject( new Error( reason ) );
										} )
										.on( 'rollbackFinished', function()
										{
											console.log( 'Received rollbackFinished in gamejolt' );
											resolve();
										} )
										.on( 'fatal', reject );
								} )
								.catch( reject );
						} )
						.then( function()
						{
							return localPackage.$setUpdateAborted();
						} )
						.then( function()
						{
							Growls.add( 'success', packageTitle + ' aborted the update.', 'Update Aborted' );
						} )
						.catch( function( err )
						{
							if ( localPackage.update_state == LocalDb_Package.UNPACKING ) {
								localPackage.$setUpdateState( LocalDb_Package.UNPACK_FAILED );
							}
							else {
								localPackage.$setUpdateState( LocalDb_Package.DOWNLOAD_FAILED );
							}
							Growls.add( 'error', packageTitle + ' cannot abort at this time. Retry or uninstall it.', 'Update Failed')
						} );
					}
				}
			} )
			.catch( function( err )
			{
				console.error( err );

				var action = operation == 'install' ? 'install' : 'update';
				var title = operation == 'install' ? 'Installation Failed' : 'Update Failed';
				Growls.add( 'error', packageTitle + ' failed to ' + action + '.', title );

				if ( localPackage.install_state ) {
					if ( localPackage.install_state == LocalDb_Package.UNPACKING ) {
						localPackage.$setInstallState( LocalDb_Package.UNPACK_FAILED );
					}
					else {
						localPackage.$setInstallState( LocalDb_Package.DOWNLOAD_FAILED );
					}
				}
				else if ( localPackage.update_state ) {
					if ( localPackage.update_state == LocalDb_Package.UNPACKING ) {
						localPackage.$setUpdateState( LocalDb_Package.UNPACK_FAILED );
					}
					else {
						localPackage.$setUpdateState( LocalDb_Package.DOWNLOAD_FAILED );
					}
				}

				_this._stopPatching( localPackage );
			} );
	};

	this.uninstall = function( localPackage )
	{
		var Uninstaller = require( 'client-voodoo' ).Uninstaller;

		return $q( function( resolve, reject )
		{
			Uninstaller.uninstall( localPackage )
				.then( function( uninstallInstance )
				{
					uninstallInstance
						.on( 'uninstallFinished', function()
						{
							resolve();
						} )
						.on( 'uninstallFailed', reject )
						.on( 'fatal', reject );
				} );
		} );
	};

	this._startPatching = function( localPackage, patchInstance )
	{
		if ( !this.currentlyPatching[ localPackage.id ] ) {
			this.currentlyPatching[ localPackage.id ] = patchInstance;
			++this.numPatching;
		}
	};

	this._stopPatching = function( localPackage )
	{
		if ( this.currentlyPatching[ localPackage.id ] ) {
			delete this.currentlyPatching[ localPackage.id ];
			--this.numPatching;
		}
	};

	this.pause = function( localPackage )
	{
		var patchInstance = _this.currentlyPatching[ localPackage.id ];
		if ( !patchInstance ) {
			throw new Error( 'Package is not installing.' );
		}

		return patchInstance.pause();
	};

	this.resume = function( localPackage )
	{
		var patchInstance = _this.currentlyPatching[ localPackage.id ];

		if ( !patchInstance ) {
			return this.retryInstall( localPackage );
		}

		return this._getAccessToken( localPackage.id )
			.catch( function( e )
			{
				console.log( 'Could not get access token for package ' + localPackage.id );
				console.error( e );
				return '';
			} )
			.then( function( authToken )
			{
				return patchInstance.resume( { authToken: authToken } );
			} );
	};

	this.cancel = function( localPackage )
	{
		var patchInstance = _this.currentlyPatching[ localPackage.id ];
		if ( !patchInstance ) {
			return $q.resolve( false );
		}

		return patchInstance.cancel()
			.then( function() { return true } );
	};
} );
