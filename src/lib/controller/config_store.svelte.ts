import { z } from 'zod/v4';
import type { BaseConfig, Views } from '$lib/model/types';
import { schemaStore, TABLE_DEFINITIONS, type ClientSchemas } from '$lib/model/schemas';
import type { IColumn } from '@svar-ui/svelte-grid';

export class ConfigStore {
	base = z.registry<BaseConfig>();
	constructor() {}

	addConfig(schema: ClientSchemas, config: BaseConfig) {
		this.base.add(schema, config);
		return this;
	}
	addViewConfig(schema: ClientSchemas, config: Partial<Record<Views, any>>) {
		let base = this.base.get(schema)!;
		base = { ...base, ...config };
		this.base.add(schema, base);
		return this;
	}
}

/**
 * Create route-local view configuration from the shared table registry.
 *
 * Keeping this registry local prevents universal page loads from sharing
 * mutable view metadata between requests or navigations.
 */
export function createBaseConfigStore(): ConfigStore {
	const store = new ConfigStore();

	// View capability and labels come from TABLE_DEFINITIONS. Feature builders
	// add columns, graph nodes, and map styling without re-registering tables.
	for (const definition of TABLE_DEFINITIONS) {
		const registryEntry = schemaStore.store.get(definition.name);
		if (registryEntry) {
			const default_config = schemaStore.defaultConfig(definition.name);
			if (!default_config) continue;
			store.addConfig(registryEntry.client, default_config);
		}
	}

	return store;
}
