import { db } from "$lib/server/surreal.svelte";
import { error, json } from "@sveltejs/kit";
import type { PageServerData } from "./$types";


export const load: PageServerData = async () => {
	const connected = await db.connect();

	return { db: db.status };
};
