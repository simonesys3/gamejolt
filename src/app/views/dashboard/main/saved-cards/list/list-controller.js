angular.module( 'App.Views' ).controller( 'Dashboard.Main.SavedCards.ListCtrl', function( App, User_SavedCard, ModalConfirm, gettextCatalog, payload )
{
	App.title = gettextCatalog.getString( 'Saved Cards' );

	this.cards = User_SavedCard.populate( payload.cards );

	this.removeCard = function(card)
	{
		ModalConfirm.show( gettextCatalog.getString( 'dash.saved_cards.remove_confirmation' ) )
			.then( function()
			{
				return card.$remove();
			} )
			.then( function()
			{
				Growls.success(
					gettextCatalog.getString( 'dash.saved_cards.removed_growl' ),
					gettextCatalog.getString( 'dash.saved_cards.removed_growl_title' )
				);
				$state.go( 'dashboard.main.saved-cards.list' );
			} );
	};
} );
