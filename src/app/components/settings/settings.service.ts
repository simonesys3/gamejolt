import { Environment } from '../../../lib/gj-lib-client/components/environment/environment.service';

const STORAGE_PREFIX = 'settings.';

type SettingValue = string | number | boolean;

interface Setting
{
	type: 'string' | 'number' | 'boolean';
	val: SettingValue | Function;
}

const defaultSettings: { [k: string]: Setting } = {
	'game-install-dir': {
		type: 'string',
		val: () =>
		{
			const gui = require( 'nw.gui' );
			const path = require( 'path' );
			const dataPath = gui.App.dataPath;

			return path.join( dataPath, 'Games' );
		},
	},
	'max-download-count': {
		type: 'number',
		val: 5,
	},
	'max-extract-count': {
		type: 'number',
		val: 1,
	},
	'queue-when-playing': {
		type: 'boolean',
		val: 1,
	},
	'autostart-client': {
		type: 'boolean',
		val: 1,
	},
	'chat-notify-friends-online': {
		type: 'boolean',

		// By default we don't notify friends state in site.
		// We do notify by default in client.
		val: () => Environment.isClient ? 1 : 0,
	},
	'restricted-browsing': {
		type: 'boolean',
		val: 1,
	},
	'sidebar': {
		type: 'boolean',
		val: 1,
	},
	'broadcast-modal': {
		type: 'boolean',
		val: 1,
	}
};

export class Settings
{
	static getDefault( setting: string )
	{
		const val = defaultSettings[ setting ].val;
		if ( val && typeof val === 'function' ) {
			return val();
		}

		return val || undefined;
	}

	static get( setting: string )
	{
		if ( typeof defaultSettings[ setting ] !== 'undefined' ) {

			let val;
			if ( localStorage.getItem( STORAGE_PREFIX + setting ) !== null ) {
				val = localStorage.getItem( STORAGE_PREFIX + setting );
			}
			else {
				val = this.getDefault( setting );
			}

			if ( defaultSettings[ setting ].type === 'string' && typeof val !== 'string' ) {
				val = '' + val;
			}
			else if ( defaultSettings[ setting ].type === 'number' && typeof val !== 'number' ) {
				val = parseInt( val, 10 );
			}
			else if ( defaultSettings[ setting ].type === 'boolean' ) {
				if ( val === '0' ) {
					val = false;
				}
				val = !!val;
			}
			return val;
		}
		return null;
	}

	static set( setting: string, val: SettingValue )
	{
		if ( typeof defaultSettings[ setting ] === 'undefined' ) {
			return this;
		}

		if ( val === true ) {
			val = '1';
		}
		else if ( val === false ) {
			val = '0';
		}
		else if ( typeof val === 'number' ) {
			val = '' + val;
		}

		localStorage.setItem( STORAGE_PREFIX + setting, val );

		return this;
	}
}
