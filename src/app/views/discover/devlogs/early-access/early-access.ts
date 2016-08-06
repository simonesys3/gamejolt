import { provide } from 'ng-metadata/core';
import { EarlyAccessCtrl } from './early-access-controller';
import { FetchCtrl } from './_fetch-controller';

export default angular.module( 'App.Views.Discover.Devlogs.EarlyAccess', [] )
.controller( ...provide( 'Discover.Devlogs.EarlyAccessCtrl', { useClass: EarlyAccessCtrl } ) )
.controller( ...provide( 'Discover.Devlogs.EarlyAccess._FetchCtrl', { useClass: FetchCtrl } ) )
.name
;
