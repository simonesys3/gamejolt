import { Injectable, Inject } from 'ng-metadata/core';
import { ListCtrl } from './list-controller';

interface Scope extends ng.IScope {
	$ctrl: ListCtrl;
}

@Injectable()
export class FetchCtrl
{
	constructor(
		@Inject( '$scope' ) $scope: Scope,
		@Inject( 'payload' ) payload: any,
	)
	{
		$scope.$ctrl.listing.processPayload( payload );
	}
}
