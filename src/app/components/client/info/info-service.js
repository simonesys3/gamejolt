var ipcRenderer = require( 'electron' ).ipcRenderer;

angular.module( 'App.Client.Info' ).service( 'Client_Info', function()
{
	// var os = require( 'os' );
	// var path = require( 'path' );

	this.getPackageJson = function()
	{
		// var cwd = path.dirname( process.mainModule.filename );

		// Slightly different path on dev and mac.
		// var packagePath = path.resolve( cwd, '..', 'package.json' );
		// if ( Environment.buildType == 'development' || os.type() == 'Darwin' ) {
		// 	packagePath = path.resolve( cwd, 'package.json' );
		// }

		// return require( packagePath );

		return ipcRenderer.sendSync( 'get-package-json' );
	};

	this.getVersion = function()
	{
		return this.getPackageJson().version;
	};
} );
