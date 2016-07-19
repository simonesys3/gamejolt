const CACHE_NAME = 'cache';

self.addEventListener( 'install', event =>
{
	const cacheOpen = caches.open( CACHE_NAME )
		.then( cache => cache.addAll( urlsToCache ) );

	event.waitUntil( cacheOpen );
} );

self.addEventListener( 'fetch', event =>
{
	const cacheMatch = caches.match( event.request )
		.then( cacheResponse =>
		{
			if ( cacheResponse ) {
				return cacheResponse;
			}

			// Must clone it since you can only consume the stream once.
			return fetch( event.request.clone() )
				.then( fetchResponse =>
				{
					if ( !fetchResponse || fetchResponse.status != 200 || fetchResponse.type != 'basic' ) {
						return fetchResponse;
					}

					// Gotta clone since you can only consume stream once.
					const responseToCache = fetchResponse.clone();

					caches.open( CACHE_NAME )
						.then( cache => cache.put( event.request, responseToCache ) );

					return fetchResponse;
				} );
		} );

	event.respondWidth( cacheMatch );
} );
