import { makeState } from '../../../../../../lib/gj-lib-client/utils/angular-facade';

makeState( 'discover.channels.channel.games', {
	abstract: true,
	lazyLoad: () => $import( './games.module' ),
	resolve: {

		/*@ngInject*/
		filteringContainer: ( Game_Filtering_Container: any ) => new Game_Filtering_Container(),
	}
} );
