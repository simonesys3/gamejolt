angular.module( 'App.Forms.Dashboard' ).directive( 'gjFormDashboardGameLinkedKeyPool', function( Form, LinkedKey_Pool )
{
	var form = new Form( {
		model: 'LinkedKey_Pool',
		template: '/app/components/forms/dashboard/game/linked-key-pool/linked-key-pool.html',
		resetOnSubmit: true,
	} );

	form.scope.game = '=';

	form.onInit = function( scope )
	{
		scope.LinkedKey_Pool = LinkedKey_Pool;
		scope.formModel.game_id = scope.game.id;

		scope.formModel.packages = {};
		if ( scope.method == 'add' ) {

		}

		if ( scope.method == 'edit' ) {

		}

	};

	return form;
} );
