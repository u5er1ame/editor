import { Table } from 'surrealdb';
import { z, type GlobalMeta, type ZodSafeParseResult } from 'zod/v4';
import { type Data, type Schemas } from '$lib/client/schemas';
import type { View } from '$lib/view/table.svelte';
import type { SurrealStore } from '$lib/client/db.context.svelte';
import { getSurrealContext } from '$lib/client/db.context.svelte';
import { schemas, table_registry, type TablesMeta } from './schemas';

export class SchemaStore {
	#schemas = new Map<string, Schemas>();
	metadata_registry = table_registry;
	registerSchemas() {
		schemas.forEach((schema) => {
			if (this.metadata_registry.has(schema)) {
				const tbl = this.metadata_registry.get(schema)!.id;
				this.#schemas.set(tbl, schema); // TODO: how to verify id in schema for sure?
			}
		});
		console.log('registered schemas', this.#schemas);
	}

	getSchema(table: string): Schemas {
		const out = this.#schemas.get(table);
		if (out == undefined) throw new Error('Schema not found:' + table);
		return out;
	}

	async getData(table: string): Promise<ZodSafeParseResult<Data[]>> {
		const schema = this.getSchema(table);
		const ctx = getSurrealContext();
		if (ctx == null) throw new Error('No DB context available');
		const res = await ctx._db.select<Data[]>(new Table(table)).catch((e) => {
			throw new Error('something wrong with data fetch');
		});
		const out = z.array(schema).safeParse(res);
		return out;
	}

	getViews(table: string): View['name'][] | undefined {
		const meta: TablesMeta | undefined = this.getTableMeta(table);
		return meta?.views; // ehhh
	}

	getTableMeta(table: string): TablesMeta | undefined {
		const schema = this.getSchema(table);
		if (schema == undefined) throw new Error('Schema not found for' + table);
		const meta = this.metadata_registry.get(schema);
		return meta;
	}

	getAllMetadata(): TablesMeta[] {
		return this.#schemas
			.values()
			.map((schema) => this.metadata_registry.get(schema))
			.filter((meta) => meta != undefined)
			.toArray();
	}
}
