import { z } from 'zod/v4';
import type { BaseConfig, Views } from '$lib/model/types';
import { AreaNameSchema, BoardSchema, BreakerConnectionSchema, BreakerSchema, ElectricRoomSchema, LevelSchema, ShopSchema, type Schemas } from '$lib/model/schemas';


export class ConfigStore {
	store = z.registry<BaseConfig>();
	constructor() {
	}

	addConfig(schema: Schemas, config: BaseConfig) {
		this.store.add(schema, config);
	}

	setViews(schema: Schemas, views: Views[]) {
		if(!this.store.has(schema)) throw new Error('Schema not found');
		const config = this.store.get(schema)!;
		config.views = views;
		this.store.add(schema, config);
	}
}

export const baseConfigStore = new ConfigStore();
baseConfigStore.addConfig(BreakerSchema, { id: 'breakers', label: 'Breakers' });
baseConfigStore.addConfig(BreakerConnectionSchema, { id: 'connects', label: 'Breaker Connections' });
baseConfigStore.addConfig(BoardSchema, { id: 'boards', label: 'Boards' });
baseConfigStore.addConfig(ElectricRoomSchema, { id: 'electric_rooms', label: 'Electric Rooms' });
baseConfigStore.addConfig(LevelSchema, { id: 'levels', label: 'Levels' });
baseConfigStore.addConfig(ShopSchema, { id: 'shops', label: 'Shops' });
baseConfigStore.addConfig(AreaNameSchema, { id: 'area_name', label: 'Areas' });
