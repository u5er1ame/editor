import type { PageServerData, PageServerLoad } from './$types';
import { getDatabaseInfo } from '$lib/db.remote';
import { error, redirect } from '@sveltejs/kit';
import { schemaStore, type Schemas } from '$lib/model/schemas';
import { baseConfigStore } from '$lib/controller/config_store.svelte';
import type { BaseConfig } from '$lib/model/types';


export const load: PageServerLoad = async ({ params, request, url }): Promise<PageServerData> => {
	const config: BaseConfig[] = []
	const info = await getDatabaseInfo().catch((e)=>{ return error(500, "Page Error")});;
	if (!info) return error(500,"Cant get database info. Are you connected to DB?");
	if (info.tables == undefined) { return error(500,"Cant get tables. Something went wrong!"); }
	if (!url.searchParams.has('table')) {
		if (info.tables && info.tables.length == 0) {
			return error(404,"Cant find any table. Create one first!");
		}
		const selected_tab = info.tables[0].name;

		if (!selected_tab) {
			return error(500,"Cant find any table. Something went wrong!");
		}
		return redirect(307, `/?table=${selected_tab}`);
	}
	const selected_tab = url.searchParams.get('table');
	for (const table of info.tables) {
		if (!schemaStore.store.has(table.name)) {
			error(404, "Cant find schema for table: " + table.name);
		}
		else {
			const schema: Schemas = schemaStore.store.get(table.name)!;
			const default_config = schemaStore.defaultConfig(table.name);
			// TODO: create config beforehand with view list
			if (!baseConfigStore.store.has(schema)) {
				console.warn('no config for schema', schema, "using default");
				baseConfigStore.addConfig(schema, default_config); // WARN: idk should i do it?
			}
			config.push(baseConfigStore.store.get(schema)!)
		}
	}
	return { tables: { selected_tab, info: info.tables, config } };
};
