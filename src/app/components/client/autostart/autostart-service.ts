import { Injectable, Inject } from 'ng-metadata/core';
import { Device } from './../../../../lib/gj-lib-client/components/device/device-service';

@Injectable()
export class ClientAutostart
{
	autostarter: any;
	execPath: string;

	constructor(
		@Inject( '$q' ) private $q: ng.IQService,
		@Inject( 'Device' ) private device: Device,
		@Inject( 'Environment' ) private env: any,
		@Inject( 'Settings' ) private settings: any
	)
	{
		this.autostarter = require( 'client-voodoo' ).Autostarter;
	}

	init()
	{
		if ( !this.canAutostart() ) {
			return;
		}

		if ( this.settings.get( 'autostart-client' ) ) {
			this.set();
		}
	}

	canAutostart()
	{
		if ( this.env.buildType == 'development' || this.device.os() != 'windows' ) {
			return false;
		}
		return true;
	}

	set()
	{
		return this.$q.when( this.autostarter.set( process.execPath, [ '--silent-start' ] ) );
	}

	clear()
	{
		return this.$q.when( this.autostarter.unset() );
	}

	check()
	{
		return this.$q.when( this.autostarter.isset() );
	}
}
