import type { IColumn } from '@svar-ui/svelte-grid';
import type { z } from 'zod/v4';

import type { ClientSchemas, TableKeys } from '$lib/model/schemas';

export type Views = "table" | "graph" | "map";

export type BaseConfig = {
	id: string,
	label: string,
	// views: Set<Views>,
} & Partial<Record<Views, any>>;
