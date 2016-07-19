import { Injectable, Inject } from 'ng-metadata/core';

@Injectable()
export class ServiceWorker
{
	init()
	{
		if ( !('serviceWorker' in navigator) ) {
			return;
		}

		navigator.serviceWorker.register( '/service-worker.js', { scope: '.' } )
			.then( registration =>
			{
				console.log( 'ServiceWorker registration successful with scope: ', registration.scope );
			} )
			.catch( err =>
			{
				console.log( 'ServiceWorker registration failed: ', err );
			} );
	}
}
