import { z, ZodObject } from "zod/v4";
import { RecordId, type Table } from "surrealdb";
import type { IColumn, TEditorType } from "@svar-ui/svelte-grid";

export class DataTable {
	table;
	schema?;
	columns?: IColumn[];
	data?: any[];
	options?: { id: string, label: string }[] = [];
	pagedData: any[] = $state([]);
	pageSize = 15;
	constructor(table: Table) {
		this.table = table;
		this.schema = schemas.get(table.name);
		if (!this.schema) {
			throw new Error(`Schema for table ${table.name} not found`);
		}
		// this.columns = this.getColumns();
	}
	async fetchData() {
		const data = await fetch(`/api/v1/db/tables/?q=${this.table.name}`).then((r) => r.json());
		this.data = data.data;
		this.pagedData = this.paginate({ from: 0, to: this.pageSize });
		const table = this.schema?.meta()?.table2fetch;
		if (table) {
			const res = await fetch("/api/v1/db/tables?q=" + table).then((r) => r.json());
			this.options = res.data.map((item: z.infer<typeof this.schema>) => ({ id: item.id, label: item.name }));
		}
	}
	paginate(e: any) {
		const { from, to } = e;
		if (this.data == null) {
			this.pagedData = [];
		} else {
			this.pagedData = this.data.slice(from, to);
		}
		return this.pagedData;
	}

	getColumns() {
		if (!this.schema) return [];

		return Object.entries(this.schema.shape).map(([key, value]) => {
			let header = key.charAt(0).toUpperCase() + key.slice(1);
			const out = {
				id: key,
				header,
				sort: true,
			} as IColumn;

			if (key == 'id') {
				out.hidden = true;
				return out;
			}
			switch (value.type) {
				case 'custom':
					/// TODO: add combobox
					out.editor = {
						type: 'combo' as TEditorType,
						config: {
							options: this.options
						},
					};
					out.options = this.options;
					break;
				case 'optional':
					/// FIXME: idk how to handle optional it could be anything
					out.editor = {
						type: 'combo' as TEditorType,
						config: {
							buttons: ["clear"],
							options: this.options,
						},
					};
					out.options = this.options;
					break;
				case "string":
					out.editor = 'text' as TEditorType;
					break;
				default:
					out.editor = 'text' as TEditorType;
			}
			return out;
		});
	}

}

const LevelSchema = z.object({
	id: z.custom<RecordId<"levels">>(),
	name: z.string(),
});
const ElectricRoomSchema = z.object({
	id: z.custom<RecordId<"electric_rooms">>(),
	name: z.string(),
	level: z.custom<RecordId<"levels">>(),
}).meta({
	table2fetch: "levels",
});
const BoardSchema = z.object({
	id: z.custom<RecordId<"boards">>(),
	name: z.string(),
	room: z.custom<RecordId<"electric_rooms">>(),
}).meta({
	table2fetch: "electric_rooms",
});
const BreakerSchema = z.object({
	id: z.custom<RecordId<"breakers">>(),
	name: z.string(),
	value: z.number().optional(),
	description: z.string().optional(), // FIXME: is this should be generated from graph?
	board: z.custom<RecordId<"boards">>(),
}).meta({
	table2fetch: "boards",
});

const BreakerConnectionSchema = z.object({
	id: z.custom<RecordId<"connects">>(),
	in: z.custom<RecordId<"breakers">>(),
	cable: z.string().optional(),
	out: z.custom<RecordId<"breakers"> | RecordId<"area_name">>(),
});

const AreaNameSchema = z.object({
	id: z.custom<RecordId<"area_name">>(),
	name: z.string(),
	shop: z.custom<RecordId<"shops">>().optional(),
}).meta({
	table2fetch: "shops",
});

const ShopSchema = z.object({
	id: z.custom<RecordId<"shops">>(),
	name: z.string(),
});

const schemas = new Map<string, ZodObject>([
	["connects", BreakerConnectionSchema],
	["levels", LevelSchema],
	["electric_rooms", ElectricRoomSchema],
	["boards", BoardSchema],
	["breakers", BreakerSchema],
	["area_name", AreaNameSchema],
	["shops", ShopSchema],
]);
