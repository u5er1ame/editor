import type { PageLoad, PageServerData } from './$types';
import { error } from '@sveltejs/kit';
import type { BaseConfig } from '$lib/model/types';
import { schemaStore, type ModelRegistry } from '$lib/model/schemas';
import { createBaseConfigStore } from '$lib/controller/config_store.svelte';
import { addFieldsMetadata } from '$lib/builder';

export const load: PageLoad = async ({ data, params, url, fetch }): Promise<PageServerData> => {
	const config: BaseConfig[] = [];
	const baseConfigStore = createBaseConfigStore();
	for (const table of data.tables.info.tables) {
		if (!schemaStore.store.has(table.name)) {
      continue;
			// error(404, 'Cant find schema for table: ' + table.name);
		} else {
			const schemas: ModelRegistry = schemaStore.store.get(table.name)!;
			if (!baseConfigStore.base.has(schemas.client)) {
     			console.warn('no config for schema', table.name, 'using default');
     			const cfg = schemaStore.defaultConfig(table.name);
     			if (!cfg) continue;
     			baseConfigStore.addConfig(schemas.client, cfg);
			}
			const cfg = baseConfigStore.base.get(schemas.client)!;

			// Build table columns if table view exists
			if (cfg.table !== undefined) {
				const hasGraphView = cfg.graph !== undefined;
				const tableConfig = addFieldsMetadata(schemas.client, hasGraphView, table.name);
				baseConfigStore.addViewConfig(schemas.client, tableConfig);
			}

			config.push(baseConfigStore.base.get(schemas.client)!);
		}
	}
	return { tables: { config, ...data.tables } };
};
