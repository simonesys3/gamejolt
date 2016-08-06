import { provide } from 'ng-metadata/core';
import { ListCtrl } from './list-controller';
import { FetchCtrl } from './_fetch-controller';

export default angular.module( 'App.Views.Discover.Devlogs.List', [] )
.controller( ...provide( 'Discover.Devlogs.ListCtrl', { useClass: ListCtrl } ) )
.controller( ...provide( 'Discover.Devlogs.List._FetchCtrl', { useClass: FetchCtrl } ) )
.name
;
