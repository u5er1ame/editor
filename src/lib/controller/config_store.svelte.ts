import { z } from 'zod/v4';
import type { BaseConfig, ColumnConfig, TableViewConfig, Views } from '$lib/model/types';
import { ClientAreaNameSchema, ClientBoardSchema, ClientBreakerConnectionSchema, ClientBreakerSchema, ClientElectricRoomSchema, LevelSchema, ShopSchema, type ClientSchemas, type ServerSchemas } from '$lib/model/schemas';
import type { IColumn } from '@svar-ui/svelte-grid';



export class ConfigStore {
	base = z.registry<BaseConfig>();
	tableViewConfig = z.registry<IColumn[]>();
	constructor() {
	}

	addConfig(schema: ClientSchemas, config: BaseConfig) {
		this.base.add(schema, config);
		return this
	}
}

export const baseConfigStore = new ConfigStore();
baseConfigStore.addConfig(ClientBreakerSchema, { id: 'breakers', label: 'Breakers', views: new Set(["table", "graph"]) });
baseConfigStore.addConfig(ClientBreakerConnectionSchema, { id: 'connects', label: 'Breaker Connections', views: new Set(["table", "graph"])  });
baseConfigStore.addConfig(ClientBoardSchema, { id: 'boards', label: 'Boards', views: new Set(["table", "graph"])  });
baseConfigStore.addConfig(ClientElectricRoomSchema, { id: 'electric_rooms', label: 'Electric Rooms', views: new Set(["table", "graph", "map"])  });
baseConfigStore.addConfig(LevelSchema, { id: 'levels', label: 'Levels', views: new Set(["table", "graph"])  });
baseConfigStore.addConfig(ShopSchema, { id: 'shops', label: 'Shops', views: new Set(["table", "graph"])  });
baseConfigStore.addConfig(ClientAreaNameSchema, { id: 'area_name', label: 'Areas', views: new Set(["table", "graph", "map"])  });
