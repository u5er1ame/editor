import type { PageLoad, PageServerData } from './$types';
import { error } from '@sveltejs/kit';
import type { BaseConfig } from '$lib/model/types';
import { schemaStore, type ModelRegistry } from '$lib/model/schemas';
import { baseConfigStore } from '$lib/controller/config_store.svelte';
import { addFieldsMetadata } from '$lib/builder';


export const load: PageLoad = async ({data, params,  url,  fetch }): Promise<PageServerData> => {
	const config: BaseConfig[] = []
	for (const table of data.tables.info.tables) {
		if (!schemaStore.store.has(table.name)) {
			error(404, "Cant find schema for table: " + table.name);
		}
		else {
			const schemas: ModelRegistry = schemaStore.store.get(table.name)!;
			const default_config = schemaStore.defaultConfig(table.name);
			if (!baseConfigStore.base.has(schemas.client)) {
				console.warn('no config for schema', table.name, "using default");
				baseConfigStore.addConfig(schemas.client, default_config); // WARN: idk should i do it?
			}
			const upd = addFieldsMetadata(schemas.client);
			// WARN: base config should exist at this point add only view config
			baseConfigStore.addViewConfig(schemas.client, upd);
			config.push(baseConfigStore.base.get(schemas.client)!)
		}
	}
	return { tables: { config, ...data.tables } };
};
