angular.module( 'App.Views' ).controller( 'Dashboard.Developer.Games.Manage.LinkedKeyPools.EditCtrl', function(
	$scope, $state, $stateParams, Api, LinkedKey_Pool, LinkedKey, Game_Package, Key, ModalConfirm, Growls, gettextCatalog, payload )
{
	var _this = this;

	$scope.LinkedKey_Pool = LinkedKey_Pool;

	this.linkedKeyPool = payload.linkedKeyPool ? new LinkedKey_Pool( payload.linkedKeyPool ) : null;
	this.linkedKeys = LinkedKey.populate( payload.linkedKeys );

	this.search = {
		filter: '',
		state: 'all',
	};

	this.searchLinkedKeys = function()
	{
		Api.sendRequest( '/web/dash/developer/games/linked-key-pools/search-keys/' + $stateParams.id + '/' + $stateParams.linkedKeyPoolId, this.search )
			.then( function( response )
			{
				_this.linkedKeys = LinkedKey.populate( response.linkedKeys );
			} );
	};

	this.onNewLinkedKeysAdded = function()
	{
		// Only reload this single state.
		$state.reload( 'dashboard.developer.games.manage.linked-key-pools.edit' );
	};

	this.removePool = function( linkedKeyPool, disableKeys )
	{
		ModalConfirm.show(
			gettextCatalog.getString( "Are you sure you want to remove this linked key pool? All keys within this key group will be invalidated. Any access that users may have gained from these keys will be revoked. This can not be reversed." ),
			gettextCatalog.getString( 'Remove linked key pool?' )
		)
			.then( function()
			{
				return linkedKeyPool.$remove()
					.catch( function()
					{
						Growls.error( 'Could not remove key pool for some reason.' );
					} );
			} )
			.then( function()
			{
				Growls.success(
					gettextCatalog.getString( 'The linked key group has been removed.' ),
					gettextCatalog.getString( 'Removed Linked Key Pool' )
				);
				$state.go( 'dashboard.developer.games.manage.linked-key-pools.list' );
			} );
	}

	this.removeLinkedKey = function( linkedKey )
	{
		ModalConfirm.show(
			gettextCatalog.getString( "Are you sure you want to remove this linked key? This will not invalidate on the third-party platform. This can not be reversed." ),
			gettextCatalog.getString( 'Remove linked key?' )
		)
			.then( function()
			{
				return linkedKey.$remove()
					.catch( function()
					{
						Growls.error( 'Could not remove linked key for some reason.' );
					} );
			} )
			.then( function()
			{
				Growls.success(
					gettextCatalog.getString( 'The linked key has been removed.' ),
					gettextCatalog.getString( 'Removed Linked Key' )
				);
				_.remove( _this.linkedKeys, { id: linkedKey.id } );
			} );
	};
} );
