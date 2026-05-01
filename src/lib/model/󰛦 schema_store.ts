import type { Table } from "surrealdb";
import { z, type GlobalMeta, type ZodSafeParseResult } from "zod/v4";
import { type Data, type Schemas } from "$lib/client/schemas";
import type { View } from "$lib/view/table.svelte";
import type { SurrealStore } from "$lib/client/db.context.svelte";

export class SchemaStore {
	#schemas = new Map<Table, Schemas>();

	addSchema(table: Table, schema: Schemas) {
		this.#schemas.set(table, schema);
	}

	getSchema(table: Table): Schemas {
		const out = this.#schemas.get(table)
		if (out == undefined) throw new Error("Schema not found");
		return out;
	}

	async getData(table: Table, ctx: SurrealStore): Promise<ZodSafeParseResult<Data>> {
		const schema = this.getSchema(table);
		const [res] = await ctx._db.select<Data[]>(table).catch((_)=>{ throw new Error("something wrong with data fetch") });
		const out = schema.safeParse(res);
		if (out.success == false) throw new Error("something wrong with data validation");
		return out;
	}

	getView(table: Table): View[] | undefined {
		return this.#schemas.get(table)?.meta?.views; // ehhh
	}

	getTableMeta(table: Table): GlobalMeta {
		const schema = this.getSchema(table);
		if (schema == undefined) return {};
		const meta = z.globalRegistry.get(schema);
		return meta ?? {};
	}
}
