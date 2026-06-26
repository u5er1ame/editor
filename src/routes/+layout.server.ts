import type { LayoutServerLoad } from "./$types";
import { db } from "$lib/server/root_db.svelte";
import type { View } from "$lib/rewrite/views/base";


const views: View[] = [
	{
		name: "Tables",
		href: "/",
	},
	{
		name: "Graph",
		href: "/graph",
	},
	{
		name: "Map",
		href: "/map",
	},
]

export const load: LayoutServerLoad = async ({ locals, fetch }) => {
		return {
			db: {
				isConnected: db.isConnected,
				username: locals.db.username,
				namespace: locals.db.namespace,
				database: locals.db.database,
			},
			views,
		}
};
