import type { LayoutServerLoad } from './$types';

export interface View {
	name: string;
	href: string;
}

const views: View[] = [
	{
		name: 'Tables',
		href: '/'
	},
	{
		name: 'Graph',
		href: '/graph'
	},
	{
		name: 'Map',
		href: '/map'
	},
	{
		name: 'Search',
		href: '/search'
	},
	{
		name: 'Admin',
		href: '/admin'
	}
];

export const load: LayoutServerLoad = async ({ locals, fetch }) => {
	return {
		db: {
			isConnected: locals.db.instance.isConnected,
			username: locals.db.username,
			namespace: locals.db.instance.namespace,
			database: locals.db.instance.database ?? locals.db.database
		},
		views
	};
};
