import { Injectable, Inject } from 'ng-metadata/core';
import { EarlyAccessCtrl } from './early-access-controller';

interface Scope extends ng.IScope {
	$ctrl: EarlyAccessCtrl;
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
