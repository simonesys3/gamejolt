angular.module( 'App.Forms.Dashboard' ).directive( 'gjFormDashboardGameLinkedKeyPoolAddLinkedKeys', function( Form, LinkedKey_Pool, Api )
{
	var form = new Form( {
		template: '/app/components/forms/dashboard/game/linked-key-pool/add-linked-keys/add-linked-keys.html',
	} );

	form.scope.linkedKeyPool = '=';

	form.onInit = function( scope )
	{
		scope.LinkedKey_Pool = LinkedKey_Pool;
	};

	form.onSubmit = function( scope )
	{
		return Api.sendRequest( '/web/dash/developer/games/linked-key-pools/add-keys/' + scope.linkedKeyPool.game_id + '/' + scope.linkedKeyPool.id, scope.formModel );
	};

	return form;
} );
