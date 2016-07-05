import { provide } from 'ng-metadata/core';
import { ClientAutostart } from './autostart-service';

export default angular.module( 'App.Client.Autostart', [] )
.run( function( ClientAutostart: ClientAutostart )
{
	ClientAutostart.init();
} )
.service( ...provide( 'ClientAutostart', { useClass: ClientAutostart } ) )
.name;
