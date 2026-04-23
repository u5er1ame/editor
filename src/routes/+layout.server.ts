import type { LayoutServerLoad } from "./$types";

import { RootDb } from "$lib/server/root_db.svelte";

const db = new RootDb();
export const load: LayoutServerLoad = async ({ locals }) => {
	await db.connect();
	await db.getInfo();
	const url = new URL(db.url)
	url.protocol = "ws" // FIXME: secure later
	// url.username = "user"
	// url.password = "user"
	return {
		db: {
			url,
			connected: db.isConnected,
			info: db.loadInfo,
			defaults: db.defaults,
			// INFO: filled from sr_token cookie
			token: locals.db.token
		},
	}
};
