import { ActivityFeedItem, ActivityFeedInput } from './item-service';
import { FiresidePost } from '../../../../lib/gj-lib-client/components/fireside/post/post-model';

export class ActivityFeedContainer
{
	items: ActivityFeedItem[] = [];
	games: { [k: string]: any } = {};

	hasItems = false;
	viewedItems: string[] = [];
	expandedItems: string[] = [];
	notificationWatermark?: number;  // Timestamp.
	reachedEnd = false;

	private _activeItem: ActivityFeedItem | undefined;
	private _scroll = 0;

	constructor( items: ActivityFeedInput[], notificationWatermark?: number )
	{
		this.append( items );

		if ( typeof notificationWatermark !== 'undefined' ) {
			this.notificationWatermark = notificationWatermark;
		}
	}

	prepend( _items: ActivityFeedInput[] )
	{
		const items = _items.map( item => new ActivityFeedItem( item ) );
		this.items = items.concat( this.items );
		this.hasItems = this.items.length > 0;
		this._processGames();
	}

	append( _items: ActivityFeedInput[] )
	{
		const items = _items.map( item => new ActivityFeedItem( item ) );
		this.items = this.items.concat( items );
		this.hasItems = this.items.length > 0;
		this._processGames();
	}

	update( _item: ActivityFeedInput )
	{
		const item = new ActivityFeedItem( _item );
		const index = _.findIndex( this.items, {
			type: item.type,
			feedItem: {
				id: item.feedItem.id,
			}
		} );

		if ( index >= 0 ) {
			this.items[ index ] = item;
		}

		this._processGames();
	}

	remove( _item: ActivityFeedInput )
	{
		const item = new ActivityFeedItem( _item );
		_.remove( this.items, {
			type: item.type,
			feedItem: {
				id: item.feedItem.id,
			}
		} );
		this.hasItems = this.items.length > 0;
		this._processGames();
	}

	setActive( active: ActivityFeedItem | undefined )
	{
		this._activeItem = active;
	}

	getActive()
	{
		return this._activeItem;
	}

	setScroll( scroll: number )
	{
		this._scroll = scroll;
	}

	getScroll()
	{
		return this._scroll;
	}

	viewed( item: ActivityFeedItem )
	{
		if ( this.viewedItems.indexOf( item.id ) != -1 ) {
			return;
		}

		this.viewedItems.push( item.id );

		if ( item.type == 'devlog-post' ) {
			const feedItem = <FiresidePost>item.feedItem;
			feedItem.$viewed();
		}
	}

	expanded( item: ActivityFeedItem )
	{
		if ( this.expandedItems.indexOf( item.id ) != -1 ) {
			return;
		}

		this.expandedItems.push( item.id );

		if ( item.type == 'devlog-post' ) {
			const feedItem = <FiresidePost>item.feedItem;
			feedItem.$expanded();
		}
	}

	/**
	 * This ensures that any reference to a particular game any of the feed items
	 * are shared across all items. It not only reduces mem usage, but also helps
	 * to keep things in sync (game follows, etc).
	 */
	private _processGames()
	{
		for ( const item of this.items ) {
			if ( item.feedItem instanceof FiresidePost ) {
				if ( !this.games[ item.feedItem.game.id ] ) {
					this.games[ item.feedItem.game.id ] = item.feedItem.game;
				}
				else {
					item.feedItem.game = this.games[ item.feedItem.game.id ];
				}
			}
		}
	}
}
