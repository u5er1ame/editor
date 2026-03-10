import { isConnected } from "$lib/server/surreal";
import { error, json } from "@sveltejs/kit";
import type { PageServerData } from "./$types";
import { db } from "$lib/db";

export const load: PageServerData = async () => {
	const connected = await isConnected();
	if (!connected) {

		// return error(500, 'Database not connected');
	}
	// return json({ db: db.status }); // call it on client
};
