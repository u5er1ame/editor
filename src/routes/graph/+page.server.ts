import type { PageServerData, PageServerLoad } from './$types';
import { getData, getDatabaseInfo } from '$lib/db.remote';
import { error } from '@sveltejs/kit';
import { schemaStore, type ModelRegistry, type ServerData } from '$lib/model/schemas';
import { baseConfigStore } from '$lib/controller/config_store.svelte';

export const load: PageServerLoad = async ({ params, request }): Promise<PageServerData> => {
	const info = await getDatabaseInfo().catch((e)=>{ error(400,e.message) });
	if (!info) return error(500,"Cant get database info. Are you connected to DB?");
	if (info.tables == undefined) { return error(500,"Cant get tables. Something went wrong!"); }
	// for (const table of info.tables) {
	// 	if (!schemaStore.store.has(table.name)) {
	// 		error(404, "Cant find schema for table: " + table.name);
	// 	}
	// 	else {
	// 	}
	// }
	return { tables: { info } };
};
