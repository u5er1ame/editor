import type { Schemas } from "$lib/model/schemas";
import type { IColumnConfig, TSortFunction } from "@svar-ui/svelte-grid";
import { SvelteSet } from "svelte/reactivity";
import z from "zod/v4";

type AllKeys<T> = T extends any ? keyof T : never;

export class ColumnBuilder {
	private _config: IColumnConfig[] = [];
	private _schema: Schemas;
	private _registry = z.registry<IColumnConfig>();
	autoConfig = { flexgrow: 1 };
	fieldsToFetch = new SvelteSet<string>([]);

	constructor(schema: Schemas) {
		this._schema = schema;
		Object.entries(schema.shape).forEach(([key, value]) => {
			const meta = value.meta;
			if (meta.table != undefined && typeof meta.table == "string") {
				this.fieldsToFetch.add(key);
			}
			this._config.push({
				id: key,
				header: key,
			});
		});
		this.hidden("id");
	}
	get config() {
		return this._config;
	}
	getFields() {
		return this.fieldsToFetch.values().toArray();
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
