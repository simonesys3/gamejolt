angular.module( 'App.Views' ).controller( 'Dashboard.Main.SavedCards.ViewCtrl', function( $scope, App, User_SavedCard, dateFilter, gettextCatalog, payload )
{
	$scope.User_SavedCard = User_SavedCard;
	$scope.dateFilter = dateFilter;

	this.card = new User_SavedCard( payload.card );

	App.title = gettextCatalog.getString( 'View Saved Card: #{{ cardId }}', { cardId: this.card.id } );
} );
