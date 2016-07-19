var gulp = require( 'gulp' );
var plugins = require( 'gulp-load-plugins' )();

module.exports = function( config )
{
	gulp.task( 'manifest', function()
	{
		return gulp.src( config.buildDir + '/**/*' )
			.pipe( plugins.manifest( {
				timestamp: true,
			} ) )
			.pipe( gulp.dest( config.buildDir ) );
	} );
};
