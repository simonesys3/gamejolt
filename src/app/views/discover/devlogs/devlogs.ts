import Overview from './overview/overview';
import List from './list/list';
import EarlyAccess from './early-access/early-access';

export default angular.module( 'App.Views.Devlogs', [
	Overview,
	List,
	EarlyAccess,
] )
.name;
