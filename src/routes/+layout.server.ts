import type { PageServerData } from "./$types";
import { getDbLocals } from "$lib/server/utils";

import { RootDb } from "$lib/server/root_db.svelte";

const db = new RootDb();
export const load: PageServerData = async () => {
	const locals = getDbLocals();
	await db.connect();
	await db.getInfo();
	const url = new URL(db.url)
	url.protocol = "ws" // FIXME: secure later
	url.username = "user"
	url.password = "user"
	return {
		db: {
			connected: db.isConnected,
			info: db.loadInfo,
			url
		},
		credentials: locals
	};
};
