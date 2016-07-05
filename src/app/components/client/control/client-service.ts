import { Injectable, Inject } from 'ng-metadata/core';
import { ClientCli } from '../cli/cli-service';

@Injectable()
export class Client
{
	private app: nw.App = require( 'nw.gui' ).App;
	private win: NWJS_Helpers.win = require( 'nw.gui' ).Window.get();

	/**
	 * Whether or not we started "hidden".
	 */
	startedSilently = false;

	constructor(
		@Inject( '$log' ) private $log: ng.ILogService,
		@Inject( 'ClientCli' ) private cli: ClientCli
	)
	{
		if ( this.app.argv.length ) {
			for ( const arg of this.app.argv ) {
				switch ( arg )
				{
					case '--silent-start':
						this.$log.info( 'Started silently.' );
						this.startedSilently = true;
						break;
				}
			}
		}

		// If the CLI took control at all, then start silently in the background.
		if ( this.cli.init() ) {
			this.startedSilently = true;
		}

		if ( !this.startedSilently ) {
			this.$log.info( 'Started explicitly. Force showing the window.' );
			this.show();
		}

		// If they try to open the app again we should get a second 'open' event.
		// We should force it into view.
		this.app.on( 'open', cmdLine =>
		{
			this.$log.info( 'They tried opening the Client again. Force showing the window.' );
			this.show();
		} );
	}

	/**
	 * A soft close. It won't quit the whole app.
	 */
	close()
	{
		this.win.close();
	}

	/**
	 * Can be used to bring the window back up when it's closed.
	 */
	show()
	{
		this.win.show();
		this.win.focus();
		this.win.restore();
	}

	/**
	 * Quits the whole app.
	 */
	quit()
	{
		// Passing in true does a force quit of the application.
		this.win.close( true );
	}

	setProgressBar( progress )
	{
		this.win.setProgressBar( progress );
	}

	clearProgressBar( progress )
	{
		this.win.setProgressBar( -1 );
	}
}
