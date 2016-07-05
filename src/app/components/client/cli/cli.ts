import { provide } from 'ng-metadata/core';
import { ClientCli } from './cli-service';

export default angular.module( 'App.Client.Cli', [] )
.service( ...provide( 'ClientCli', { useClass: ClientCli } ) )
.name;
