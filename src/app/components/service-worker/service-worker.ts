import { provide } from 'ng-metadata/core';
import { ServiceWorker } from './service-worker-service';

export default angular.module( 'App.ServiceWorker', [] )
.service( ...provide( 'ServiceWorker', { useClass: ServiceWorker } ) )
.name;
