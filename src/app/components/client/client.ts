import AutostartModule from './autostart/autostart';
import ClientControlModule from './control/control';
import ClientCliModule from './cli/cli';

angular.module( 'App.Client', [
	'gj.Connection.StatePermissions',

	ClientControlModule,
	ClientCliModule,
	'App.Client.Shortcut',
	AutostartModule,
	'App.Client.Intro',
	'App.Client.User',
	'App.Client.LocalDb',
	'App.Client.Tray',
	'App.Client.MacAppMenu',
	'App.Client.Forms',
	'App.Client.Hidpi',
	'App.Client.Library',
	'App.Client.Installer',
	'App.Client.Launcher',
	'App.Client.HideOffline',
	'App.Client.ExternalLink',
	'App.Client.StatusBar',
	'App.Client.InstallProgress',
	'App.Client.GameButtons',
	'App.Client.InstallPackageModal',
	'App.Client.PackageCardButtons',
	'App.Client.Logger',
	'App.Client.SystemReportModal',
	'App.Client.Info',
	'App.Client.HistoryNavigator',
] )
.config( function( $httpProvider )
{
	// Modify all HTTP requests to include the client version.
	$httpProvider.interceptors.push( function( $injector )
	{
		return {
			request: function( config )
			{
				var headers = {
					'x-gj-client-version': $injector.get( 'Client_Info' ).getVersion(),
				};

				config.headers = config.headers || {};
				angular.extend( config.headers, headers );

				return config;
			},
		};
	} );

} );
