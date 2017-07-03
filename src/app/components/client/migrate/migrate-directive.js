angular.module( 'App.Client.Migrate' ).component( 'gjClientMigrate', {
	templateUrl: '/app/components/client/migrate/migrate.html',
	controller: function(
		$document,
		$scope,
		$q,
		Client_Installer,
		Client_Library,
		Client_Launcher,
		Client_Migrate
	)
	{
		var ctrl = this;

		ctrl.isClosed = false;
		ctrl.packagesToMigrate = [];
		ctrl.runningPackages = [];
		ctrl.currentPackage = undefined;
		ctrl.currentIndex = 0;
		ctrl.currentPackageResolve = undefined;
		ctrl.packageFailed = false;

		$document[0].body.classList.add( 'client-migrate-no-overflow' );

		var libraryLoaded = $q( function( resolve )
		{
			$scope.$watch( function() { return Client_Library.isLoaded },
			function( isLoaded )
			{
				if ( isLoaded ) {
					resolve();
				}
			} );
		} );

		var launcherLoaded = $q( function( resolve )
		{
			$scope.$watch( function() { return Client_Launcher.isLoaded },
			function( isLoaded )
			{
				if ( isLoaded ) {
					resolve();
				}
			} );
		} );

		// The migrate process will start as soon as library loads.
		libraryLoaded.then( checkPackages );

		/**
		 * Find the packages that need to be migrated. Once all packages are
		 * migrated we no longer have to migrate ever.
		 */
		function checkPackages()
		{
			ctrl.packagesToMigrate = Client_Migrate.getPackagesToMigrate();
			console.log( 'Found packages to migrate.', ctrl.packagesToMigrate );

			if ( !ctrl.packagesToMigrate ) {
				return close();
			}

			// Wait until the launcher is loaded to check running so that the
			// data is correctly loaded in.
			launcherLoaded.then( checkRunning );
		}

		/**
		 * We can't migrate until all packages have stopped running. This checks
		 * that.
		 */
		function checkRunning()
		{
			ctrl.runningPackages = ctrl.packagesToMigrate.filter( function( item )
			{
				return item.isRunning();
			} );

			console.log( 'running packages', ctrl.runningPackages );

			var allGamesClosed = $q( function( resolve )
			{
				$scope.$watch( Client_Launcher.numGamesRunning,
				function( numGames )
				{
					console.log( 'Number of running games: ' + numGames );
					if ( !numGames ) {
						resolve();
					}
				} );
			} );

			allGamesClosed.then( migrate );
		}

		function migrate()
		{
			console.log( 'Begin migration.' );
			migratePackage( 0 ).then( close );
		}

		function migratePackage( index )
		{
			if ( index >= ctrl.packagesToMigrate.length ) {
				console.log( 'No more packages to migrate.' );
				Client_Installer.retryAllInstalls();
				return $q.resolve();
			}

			return $q( function( resolve )
			{
				tryMigratePackage( index, resolve );
			} );
		}

		function tryMigratePackage( index, resolve )
		{
			ctrl.currentPackageResolve = resolve;
			ctrl.packageFailed = false;
			ctrl.currentIndex = index;
			ctrl.currentPackage = ctrl.packagesToMigrate[ index ];
			try {
				Client_Migrate.migratePackage( ctrl.currentPackage );
				migratePackage( index + 1 ).then( resolve );
			}
			catch ( e ) {
				ctrl.packageFailed = true;
				console.error( e );
			}
		}

		/**
		 * Hide the migrate process/modal.
		 */
		function close()
		{
			$document[0].body.classList.remove( 'client-migrate-no-overflow' );
			ctrl.isClosed = true;
		}

		/**
		 * Will retry to migrate the current package.
		 */
		ctrl.retry = function()
		{
			// Since retrying is usually so fast that angular doesn't update the
			// view in time, we want to wait before actually trying so that the
			// message goes away and then appears again. Otherwise it looks like
			// the button is broken.
			ctrl.packageFailed = false;
			setTimeout( function()
			{
				tryMigratePackage( ctrl.currentIndex, ctrl.currentPackageResolve );
			}, 100 );
		};

		/**
		 * Uninstalls the current package rather than processing it.
		 */
		ctrl.uninstall = function()
		{
			var resolve = ctrl.currentPackageResolve;
			var index = ctrl.currentIndex;

			Client_Installer.uninstall( ctrl.currentPackage )
				.then( function()
				{
					return migratePackage( index + 1 )
						.then( resolve );
				}, function( err )
				{
					ctrl.packageFailed = true;
				} );
		};

		ctrl.progress = function()
		{
			return (ctrl.currentIndex + 1) / ctrl.packagesToMigrate.length * 100;
		};

		ctrl.packageTitle = function( item )
		{
			var game = Client_Library.games[ item.game_id ];
			return item.title || game.title;
		};
	},
} );
