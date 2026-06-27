import type { IColumn } from '@svar-ui/svelte-grid';
import type { z } from 'zod/v4';

import type { ClientSchemas, TableKeys } from '$lib/model/schemas';

export type Views = "table" | "graph" | "map";

export type BaseConfig = {
	id: string,
	label: string,
	views: Set<Views>,
};

export type ColumnConfig<T extends ClientSchemas> = Omit<IColumn, 'id'> & { id:  TableKeys<T> };

export type TableViewConfig<T extends ClientSchemas> = ColumnConfig<T>[]
