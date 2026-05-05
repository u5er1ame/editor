import type { Schemas } from "$lib/model/schemas";
import type { IColumnConfig, TSortFunction } from "@svar-ui/svelte-grid";
import z from "zod/v4";

type AllKeys<T> = T extends any ? keyof T : never;

export class ColumnBuilder {
	private _config: IColumnConfig[] = [];
	private _schema: Schemas;
	private _registry = z.registry<IColumnConfig>();
	autoConfig = { flexgrow: 1 };
	constructor(schema: Schemas) {
		this._schema = schema;
		Object.entries(schema.shape).forEach(([key, value]) => {
			this._config.push({
				id: key,
			});
			console.log(value.type);
		});
	}
	get config() {
		return this._config;
	}
	hidden(key: AllKeys<Schemas["shape"]>) {
		// INFO: ! valid because it created in constructor
		this._config.find((c) => c.id == key)!.hidden = true;
		return this;
	}
	sort(key: AllKeys<Schemas["shape"]>, fn?: TSortFunction) {
		// INFO: ! valid because it created in constructor
		this._config.find((c) => c.id == key)!.sort = fn ?? true;
		return this;
	}
}
