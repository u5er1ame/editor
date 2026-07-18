import type { IColumn } from '@svar-ui/svelte-grid';
import type { z } from 'zod/v4';

import type { ClientSchemas, TableKeys, TABLES } from '$lib/model/schemas';

export type Views = "table" | "graph" | "map";

export type Tables = typeof TABLES[number];

export type BaseConfig = {
	id: Tables,
	label: string,
	// views: Set<Views>,
} & Partial<Record<Views, any>>;
