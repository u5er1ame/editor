import type { Data } from "$lib/client/schemas";
import type { IColumnConfig, IHeaderCell, TColumnHeaderConfig } from "@svar-ui/svelte-grid";

type AllKeys<T> = T extends any ? keyof T : never;

export class ColumnBuilder {
	column: IColumnConfig = {};
	constructor(key: AllKeys<Data>, options: any) {
		this.column.id = key;
	}

	hidden() {
		this.column.hidden = true;
		return this;
	}

	header(header?: TColumnHeaderConfig) {
		if (header == undefined) return this;
	}
}
