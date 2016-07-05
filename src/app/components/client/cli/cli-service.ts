import { Injectable, Inject } from 'ng-metadata/core';
import Minimist = require( 'minimist' );
import nw = require( 'nw.gui' );

const HELP = `
Usage:
	$ game-jolt-client <command> [options]

Commands:
	release:push	Creates and pushes a new release.

Options:
	--game, -g	The game ID.
`;

@Injectable()
export class ClientCli
{
	private app = nw.App;

	constructor(
		@Inject( '$log' ) private $log: ng.ILogService
	)
	{
	}

	init(): boolean
	{
		if ( this.app.argv.length ) {
			return this._processInput( this.app.argv );
		}

		// nwjs (since it's single-window mode) will not run this in the window that opened
		// it if it's already running. It will funnel off to the window that's open and just
		// immediately close. Not sure how to fix or get around this yet.
		this.app.on( 'open', cmdLine =>
		{
			this._processInput( cmdLine.split( ' ' ) );
		} );
	}

	private _processInput( args: string[] )
	{
		const parsed = Minimist( args, {
			alias: {
				game: 'g',
				help: [ 'h', '?' ],
			},
		} );

		// Check for help?
		if ( parsed['help'] ) {
			process.stdout.write( HELP.trim() + '\r\n' );
			process.exit();
		}

		switch ( parsed._[0] )
		{
			case 'release:push':
				console.log( 'Push a release!' );
				return true;
		}

		return false;
	}
}
