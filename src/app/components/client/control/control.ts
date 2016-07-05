import { provide } from 'ng-metadata/core';
import { Client } from './client-service';

export default angular.module( 'App.Client.Control', [] )
.service( ...provide( 'Client', { useClass: Client } ) )
.name;
