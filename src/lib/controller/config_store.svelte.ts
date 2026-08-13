import { z } from 'zod/v4';
import type { BaseConfig, Views } from '$lib/model/types';
import {
	ClientAreaNameSchema,
	ClientBoardSchema,
	ClientBreakerConnectionSchema,
	ClientBreakerSchema,
	ClientElectricRoomSchema,
	LevelSchema,
	ClientShopSchema,
	type ClientSchemas
} from '$lib/model/schemas';
import type { IColumn } from '@svar-ui/svelte-grid';

export class ConfigStore {
	base = z.registry<BaseConfig>();
	constructor() {}

	addConfig(schema: ClientSchemas, config: BaseConfig) {
		// Determine which additional views this table supports
		switch (config.id) {
			case 'electric_rooms':
			case 'boards':
			case 'breakers':
			case 'connects':
				config.graph = {};
				config.table = {};
				break;
			default:
				// All tables have table view
				config.table = {};
		}
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

export const baseConfigStore = new ConfigStore();
baseConfigStore.addConfig(ClientBreakerSchema, { id: 'breakers', label: 'Breakers' });
baseConfigStore.addConfig(ClientBreakerConnectionSchema, {
	id: 'connects',
	label: 'Breaker Connections'
});
baseConfigStore.addConfig(ClientBoardSchema, { id: 'boards', label: 'Boards' });
baseConfigStore.addConfig(ClientElectricRoomSchema, {
	id: 'electric_rooms',
	label: 'Electric Rooms'
});
baseConfigStore.addConfig(LevelSchema, { id: 'levels', label: 'Levels' });
baseConfigStore.addConfig(ClientShopSchema, { id: 'shops', label: 'Shops' });
baseConfigStore.addConfig(ClientAreaNameSchema, { id: 'area_name', label: 'Areas' });
