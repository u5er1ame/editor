import type { Table } from "surrealdb";
import type { ZodType } from "zod/v4";

import { schemas, type Schemas } from "$lib/client/schemas";
import { SurrealStore, type DatabaseInfo } from "$lib/client/db.context.svelte";
import type { View } from "$lib/view/table.svelte";
import { SvelteSet } from "svelte/reactivity";

export class ModelStore {
	ctx: SurrealStore | null = $state(null);
	tables: DatabaseInfo["tables"] = $state([]);
	views: SvelteSet<View> = new SvelteSet([]);
	schemas = schemas;
	constructor(ctx: SurrealStore | null) {
		if (ctx == null) throw new Error("no db context");
		this.ctx = ctx;
	}

	registerView(views: View[]) {
		views.forEach((v) => this.views.add(v));
	}

	async getTables() {
		if (this.ctx == null) throw new Error("no db context");
		const [res] = await this.ctx._db.query<DatabaseInfo[]>(`info for db structure`);
		this.tables = res.tables;
	}
}

export class DataSet  {
	name: Table;
	schema: ZodType;
	availableViews: string[] = [];
	data: any[] | null = null;

	constructor(name: Table) {
		const schema = schemas.get(name.name);
		if ( schema == undefined) {
			throw new Error(`Schema for table ${name.name} not found`);
		}
		this.name = name;
		this.schema = schema;
	}

	async fetchData(ctx: SurrealStore) {
		// TODO: handle error
		const data = await ctx?._db.query<typeof this.name[]>(`select * from ${this.name.name}`);
		this.data = data ?? null;
	}
}
