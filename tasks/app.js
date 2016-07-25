var argv = require( 'minimist' )( process.argv );
var gulp = require( 'gulp' );
var gutil = require( 'gulp-util' );
var plugins = require( 'gulp-load-plugins' )();
var sequence = require( 'run-sequence' );
var fs = require( 'fs' );
var path = require( 'path' );

module.exports = function( config )
{
	config.app = argv.app || false;

	// We can skip all this stuff if not doing an app build.
	if ( !config.app ) {
		return;
	}

	config.noInject = true;  // Don't revision filenames.
	config.noSourcemaps = true;  // Reduce package size. Not needed.

	if ( config.production ) {
		config.buildDir = 'build/app/prod/www';
	}
	else {
		config.buildDir = 'build/app/dev/www';
	}

	// Injections to modify App for app build.
	config.injections = {
		// Attach a class to say that we're in app.
		// Makes it easy to target app before angular has loaded in completely with CSS.
		'<body class="" ': '<body class="is-app" ',

		// GA tag is different.
		// "ga('create', 'UA-6742777-1', 'auto');": "ga('create', 'UA-6742777-16', 'auto');",
	};

	var modifySections = config.sections.map( function( section )
	{
		if ( section == 'app' ) {
			section = 'index';
		}

		gulp.task( 'app:modify-index:' + section, function()
		{
			// Base tag for index.html is different.
			// App uses fallback mode for location since it's not served through a server.
			var base = section + '.html';

			// When packaged up, we put it in the sub-folder: "package".
			// if ( !config.watching && os.type() != 'Darwin' ) {
			// 	base = '/package' + base;
			// }

			return gulp.src( config.buildDir + '/' + section + '.html' )
				.pipe( plugins.replace( '<base href="/">', '<base href="' + base + '">' ) )
				.pipe( gulp.dest( config.buildDir ) );
		} );

		return 'app:modify-index:' + section;
	} );

	// Set it up as a post-html build task.
	gulp.task( 'html:post', modifySections );

	/**
	 * This should rewrite all file references to have the correct packaged folder prefix.
	 */
	gulp.task( 'app:modify-urls', function()
	{
		var revAll = new plugins.revAll( {
			// prefix: 'app://game-jolt-client/package',
			dontGlobal: [
				/^\/node_modules\/.*$/,
				/^\/tmp\/.*$/,
			],
			// dontRenameFile: [ /^.*$/ ],  // Don't rename anything.
			transformFilename: function( file, hash )
			{
				console.log( 'filename', path.basename( file.path ) );
				// Don't rename the file reference at all, either.
				return path.basename( file.path );
			},
			transformPath: function( rev, source, path )
			{
				console.log( 'path', rev.substring( 1 ) );
				return rev.substring( 1 );
			},
			debug: true,
		} );

		// Ignore folders from the very beginning speeds up the injection a lot.
		return gulp.src( [
				config.buildDir + '/**',
				'!' + config.buildDir + '/node_modules/**',
				'!' + config.buildDir + '/tmp/**',
			] )
			.pipe( revAll.revision() )
			.pipe( gulp.dest( config.buildDir ) );
	} );

	gulp.task( 'post', function( cb )
	{
		// if ( config.watching ) {
		// 	return sequence( 'client:prepare', cb );
		// }

		return sequence( 'app:modify-urls', cb );
	} );
};
