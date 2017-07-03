var fs = require( 'fs' );
var path = require( 'path' );

angular.module( 'App.Client.Migrate' ) .service( 'Client_Migrate', function(
	$q, Client_Library, Device
)
{
	this.getPackagesToMigrate = function()
	{
		var packagesToMigrate = [];

		angular.forEach( Client_Library.packages, function( item )
		{
			var manifestPath = path.join( item.install_dir, '.manifest' );
			try {
				fs.accessSync( manifestPath, fs.R_OK );
			}
			catch ( e ) {
				packagesToMigrate.push( item );
			}
		} );

		return packagesToMigrate;
	};

	this.migratePackage = function( item )
	{
		console.log( 'Migrating package: ', item.id );

		// Constants for checking the current stage for resuming.
		var STAGE_NONE = 0;
		var STAGE_TMP_PATH = 1;
		var STAGE_INSTALL_DIR = 2;
		var STAGE_DATA_PATH = 3;
		var STAGE_ARCHIVE_FILE_LIST = 4;
		var STAGE_PATCH_FILE_LIST = 5;

		var basename = path.basename( item.install_dir );
		var dirname = path.dirname( item.install_dir );
		var tmpPath = path.join( dirname, '_migrate-' + basename );
		var newDataPath = path.join( item.install_dir, 'data' );

		// STAGE CHECKS

		// Go backwards through the steps to find the stage. This way we find
		// what was last done.
		var stage = STAGE_NONE;

		if ( !stage ) {
			try {
				// The archive file list is outside the data folder and the data folder exists.
				fs.accessSync( path.join( item.install_dir, '.gj-archive-file-list' ), fs.R_OK );
				fs.accessSync( newDataPath, fs.R_OK );
				stage = STAGE_ARCHIVE_FILE_LIST;
			}
			catch ( e ) {}
		}

		if ( !stage ) {
			try {
				fs.accessSync( newDataPath, fs.R_OK );
				stage = STAGE_DATA_PATH;
			}
			catch ( e ) {}
		}

		if ( !stage ) {
			try {
				// The install dir is there and the tmp path is there.
				fs.accessSync( tmpPath, fs.R_OK );
				fs.accessSync( item.install_dir, fs.R_OK );
				stage = STAGE_INSTALL_DIR;
			}
			catch ( e ) {}
		}

		if ( !stage ) {
			try {
				fs.accessSync( tmpPath, fs.R_OK );
				stage = STAGE_TMP_PATH;
			}
			catch ( e ) {}
		}

		if ( stage ) {
			console.log( 'Resuming from stage: ', stage );
		}

		// DO STAGES

		// Creation of tmp folder for data.
		if ( stage < STAGE_TMP_PATH ) {
			console.log( 'Rename install dir.', item.install_dir, tmpPath );
			fs.renameSync( item.install_dir, tmpPath );
		}

		// Create the new folder for the data/manifest.
		if ( stage < STAGE_INSTALL_DIR ) {
			console.log( 'Make install dir.', item.install_dir );
			fs.mkdirSync( item.install_dir );
		}

		// Move the tmp folder into the new package folder with the name "data."
		if ( stage < STAGE_DATA_PATH ) {
			console.log( 'Move tmp path to data path.', tmpPath, newDataPath );
			fs.renameSync( tmpPath, newDataPath );
		}

		// Pull the old archive file list file into the top level.
		if ( stage < STAGE_ARCHIVE_FILE_LIST ) {
			console.log( 'Move archive file list.' );
			fs.renameSync(
				path.join( newDataPath, '.gj-archive-file-list' ),
				path.join( item.install_dir, '.gj-archive-file-list' )
			);
		}

		// Pull the old patch file list file into the top level. It may not exist.
		var exists = false;
		try {
			var stats = fs.lstatSync( path.join( newDataPath, '.gj-patch-file' ) );
			exists = stats.isFile() && !stats.isSymbolicLink();
		}
		catch ( e ) {}

		if ( exists ) {
			fs.renameSync(
				path.join( newDataPath, '.gj-patch-file' ),
				path.join( item.install_dir, '.gj-patch-file' )
			);
		}

		// Pull the temp download file into the top level. It may not exist.
		exists = false;
		try {
			var stats = fs.lstatSync( path.join( newDataPath, '.gj-tempDownload' ) );
			exists = stats.isFile() && !stats.isSymbolicLink();
		}
		catch ( e ) {}

		if ( exists ) {
			fs.renameSync(
				path.join( newDataPath, '.gj-tempDownload' ),
				path.join( item.install_dir, '.tempDownload' )
			);
		}

		// It's fine to rebuild the manifest. No need for stage checks.
		var fileList = fs.readFileSync( path.join( item.install_dir, '.gj-archive-file-list' ), 'utf8' );
		var lines = fileList
			.split( "\n" )
			.map( function( line ) { return line.trim() } )
			// Make sure that empty lines are discarded.
			.filter( function( line ) { return !!line } );

		// If the patch file exists in the top level, rebuild the manifest using it as the patch info dynamic files.
		exists = false;
		try {
			var stats = fs.lstatSync( path.join( item.install_dir, '.gj-patch-file' ) );
			exists = stats.isFile() && !stats.isSymbolicLink();
		}
		catch ( e ) {}

		var patchLines = false;
		if ( exists ) {
			patchLines = fs.readFileSync( path.join( item.install_dir, '.gj-patch-file' ), 'utf8' )
				.split( "\n" )
				.map( function( line ) { return line.trim() } )
				// Make sure that empty lines are discarded.
				.filter( function( line ) { return !!line } );
		}

		var manifestData = generateManifest( item, lines, patchLines );

		fs.writeFileSync( path.join( item.install_dir, '.manifest' ), JSON.stringify( manifestData ) );
	};

	function generateManifest( item, fileList, patchList )
	{
		var launchOption = findLaunchOption( item );

		var manifest = {
			version: 1,
			gameInfo: {
				dir: 'data',
				uid: item.id + '-' + item.build.id,
				archiveFiles: fileList,
			},
			launchOptions: {
				executable: launchOption.executable_path
					? launchOption.executable_path
					: fileList[0],
			},
			os: Device.os(),
			arch: Device.arch(),
			isFirstInstall: false,
		};

		if ( item.isUpdating() ) {
			var patchInfo = {
				dir: 'data',
				uid: item.update.id + '-' + item.update.build.id,
				isDirty: !!patchList,
			};

			if ( patchList ) {
				patchInfo.dynamicFiles = patchList;
			}

			manifest.patchInfo = patchInfo;
		}

		return manifest;
	}

	function findLaunchOption( item )
	{
		var os = Device.os();
		var arch = Device.arch();

		var result = undefined;
		for ( var i = 0; i < item.launch_options.length; ++i ) {
			var launchOption = item.launch_options[ i ];
			var lOs = launchOption.os ? launchOption.os.split( '_' ) : [];
			if ( lOs.length === 0 ) {
				lOs = [ null, '32' ];
			}
			else if ( lOs.length === 1 ) {
				lOs.push( '32' );
			}

			if ( lOs[0] === os ) {
				if ( lOs[1] === arch ) {
					return launchOption;
				}
				result = launchOption;
			}
			else if ( lOs[0] === null && !result ) {
				result = launchOption;
			}
		}

		return result;
	}
} );
