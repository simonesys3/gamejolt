import {
	VuexStore,
	VuexModule,
	VuexAction,
	VuexMutation,
} from '../../lib/gj-lib-client/utils/vuex';
import {
	AppStore,
	Mutations as AppMutations,
	Actions as AppActions,
	appStore,
} from '../../lib/gj-lib-client/vue/services/app/app-store';
import {
	LibraryStore,
	Mutations as LibraryMutations,
	Actions as LibraryActions,
} from './library';
import {
	ClientLibraryStore,
	Mutations as ClientLibraryMutations,
	Actions as ClientLibraryActions,
} from './client-library';
import { Settings } from '../components/settings/settings.service';
import { Api } from '../../lib/gj-lib-client/components/api/api.service';
import { Screen } from '../../lib/gj-lib-client/components/screen/screen-service';
import { BroadcastModal } from '../components/broadcast-modal/broadcast-modal.service';
import { ModalConfirm } from '../../lib/gj-lib-client/components/modal/confirm/confirm-service';
import { Translate } from '../../lib/gj-lib-client/components/translate/translate.service';
import { Growls } from '../../lib/gj-lib-client/components/growls/growls.service';
import { router } from '../bootstrap';
import { AppBackdrop } from '../../lib/gj-lib-client/components/backdrop/backdrop';
import { Backdrop } from '../../lib/gj-lib-client/components/backdrop/backdrop.service';
import { ChatClient } from '../components/chat/client';

export type Actions = AppActions &
	LibraryActions &
	ClientLibraryActions & {
		bootstrap: undefined;
		logout: undefined;
		clear: undefined;
		loadChat: undefined;
		clearChat: undefined;
		toggleLeftPane: undefined;
		toggleRightPane: undefined;
		clearPanes: undefined;
		_checkBackdrop: undefined;
	};

export type Mutations = AppMutations &
	LibraryMutations &
	ClientLibraryMutations & {
		setNotificationsCount: number;
		_setBootstrapped: undefined;
		_clear: undefined;
		_setChat: ChatClient;
		_clearChat: undefined;
		_toggleLeftPane: undefined;
		_toggleRightPane: undefined;
		_clearPanes: undefined;
		_addBackdrop: undefined;
		_removeBackdrop: undefined;
		setIsShowingAngular: boolean;
		setAngularPayload: any;
	};

const modules: any = {
	app: appStore,
	library: new LibraryStore(),
};
if (GJ_IS_CLIENT) {
	const clientLibrary = require('./client-library').ClientLibraryStore;
	modules.clientLibrary = new clientLibrary();
}
@VuexModule({
	store: true,
	modules: modules,
})
export class Store extends VuexStore<Store, Actions, Mutations> {
	app: AppStore;
	library: LibraryStore;
	clientLibrary: ClientLibraryStore;

	chat: ChatClient | null = null;

	isBootstrapped = false;
	_bootstrappedResolver: Function | null = null;
	bootstrappedPromise = new Promise(
		resolve => (this._bootstrappedResolver = resolve)
	);

	notificationCount = 0;

	isLeftPaneSticky = Settings.get('sidebar') as boolean;
	isLeftPaneOverlayed = false;
	isRightPaneOverlayed = false;
	backdrop: AppBackdrop | null = null;

	isShowingAngular = false;
	angularPayload: any = null;

	get isLeftPaneVisible() {
		if (Screen.isDesktop) {
			return this.isLeftPaneSticky;
		}

		return this.isLeftPaneOverlayed;
	}

	get isRightPaneVisible() {
		return this.isRightPaneOverlayed;
	}

	get shouldShowLeftPaneBackdrop() {
		return this.isLeftPaneOverlayed && Screen.isMobile;
	}

	@VuexAction
	async bootstrap() {
		const prevResolver = this._bootstrappedResolver;
		const response = await Api.sendRequest('/web/library');

		// If we failed to finish before we unbootstrapped, then stop.
		if (this._bootstrappedResolver !== prevResolver) {
			return;
		}

		this.commit('library/bootstrap', response);

		this._setBootstrapped();

		BroadcastModal.check();
	}

	@VuexAction
	async logout() {
		const result = await ModalConfirm.show(
			Translate.$gettext('Are you seriously going to leave us?'),
			Translate.$gettext('Logout?'),
			'yes'
		);

		if (!result) {
			return;
		}

		// Must send POST.
		// This should clear out the user as well.
		await Api.sendRequest('/web/dash/account/logout', {});

		// We go to the homepage currently just in case they're in a view they shouldn't be.
		router.push({ name: 'discover.home' });

		Growls.success(
			Translate.$gettext('You are now logged out.'),
			Translate.$gettext('Goodbye!')
		);
	}

	@VuexAction
	async clear() {
		this._clear();
		this.commit('library/clear');
	}

	@VuexAction
	async loadChat() {
		const mod = await $import('../components/chat/client');
		const chatClientModel: typeof ChatClient = mod.ChatClient;
		this._setChat(new chatClientModel());
	}

	@VuexAction
	async clearChat() {
		// Log out of chat. This will notify other tabs to disconnect from the server too.
		if (this.chat) {
			this.chat.logout();
		}

		this._clearChat();
	}

	@VuexAction
	async toggleLeftPane() {
		this._toggleLeftPane();
		this._checkBackdrop();
		Settings.set('sidebar', this.isLeftPaneSticky);
	}

	@VuexAction
	async toggleRightPane() {
		this._toggleRightPane();
		this._checkBackdrop();
	}

	@VuexAction
	async clearPanes() {
		this._clearPanes();
		this._checkBackdrop();
	}

	@VuexAction
	async _checkBackdrop() {
		// Ensure we have a backdrop if anything is overlayed.
		// Otherwise ensure the backdrop is gone.
		if (this.isRightPaneOverlayed || this.shouldShowLeftPaneBackdrop) {
			if (this.backdrop) {
				return;
			}

			this._addBackdrop();
			this.backdrop!.$on('clicked', () => {
				this._clearPanes();
				this._checkBackdrop();
			});
		} else if (this.backdrop) {
			this._removeBackdrop();
		}
	}

	@VuexMutation
	setNotificationCount(count: Mutations['setNotificationsCount']) {
		this.notificationCount = count;
	}

	@VuexMutation
	_setBootstrapped() {
		this.isBootstrapped = true;
		if (this._bootstrappedResolver) {
			this._bootstrappedResolver();
		}
	}

	@VuexMutation
	_clear() {
		this.bootstrappedPromise = new Promise(
			resolve => (this._bootstrappedResolver = resolve)
		);
	}

	@VuexMutation
	_setChat(chat: Mutations['_setChat']) {
		this.chat = chat;
	}

	@VuexMutation
	_clearChat() {
		this.chat = null;
	}

	@VuexMutation
	_toggleLeftPane() {
		if (Screen.isDesktop) {
			this.isLeftPaneSticky = !this.isLeftPaneSticky;
		} else {
			this.isLeftPaneOverlayed = !this.isLeftPaneOverlayed;
		}

		this.isRightPaneOverlayed = false;
	}

	@VuexMutation
	_toggleRightPane() {
		this.isRightPaneOverlayed = !this.isRightPaneOverlayed;
		this.isLeftPaneOverlayed = false;
	}

	@VuexMutation
	_clearPanes() {
		this.isRightPaneOverlayed = false;
		this.isLeftPaneOverlayed = false;
	}

	@VuexMutation
	_addBackdrop() {
		if (this.backdrop) {
			return;
		}

		this.backdrop = Backdrop.push(
			document.getElementById('shell-body') as HTMLElement
		);
	}

	@VuexMutation
	_removeBackdrop() {
		if (!this.backdrop) {
			return;
		}

		Backdrop.remove(this.backdrop);
		this.backdrop = null;
	}

	@VuexMutation
	setIsShowingAngular(visible: Mutations['setIsShowingAngular']) {
		this.isShowingAngular = visible;
	}

	@VuexMutation
	setAngularPayload(payload: any) {
		this.angularPayload = payload;
	}
}

export const store = new Store();

// Bootstrap/clear the app when user changes.
store.watch(
	state => state.app.user && state.app.user.id,
	userId => {
		const isLoggedIn = !!userId;

		if (isLoggedIn) {
			store.dispatch('bootstrap');
			store.dispatch('loadChat');

			if (GJ_IS_CLIENT) {
				store.dispatch('clientLibrary/bootstrap');
			}
		} else {
			store.dispatch('clear');
			store.dispatch('clearChat');

			if (GJ_IS_CLIENT) {
				store.dispatch('clientLibrary/clear');
			}
		}
	}
);