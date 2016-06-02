angular.module( 'App.Views' ).controller( 'Dashboard.Developer.Games.Manage.LinkedKeyPools.ListCtrl', function(
	$scope, App, LinkedKey_Pool, gettextCatalog, payload )
{
	var _this = this;

	$scope.LinkedKey_Pool = LinkedKey_Pool;

	this.linkedKeyPools = LinkedKey_Pool.populate( payload.linkedKeyPools );

	var manageCtrl = $scope.manageCtrl;
	App.title = 'Manage Linked Key Pools for {{ manageCtrl.game.title }}';  // gettextCatalog.getString('' , { game: manageCtrl.game.title } );

	this.onLinkedKeyPoolAdded = function( linkedKeyPool )
	{
		this.linkedKeyPools.push( linkedKeyPool );
		this.isAdding = false;
	};
} );
