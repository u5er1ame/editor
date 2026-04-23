import { z } from "zod/v4";
import { type Table } from "surrealdb";
import type { IApi, IColumn, IColumnConfig, IHeaderCell, IHeaderFilter, IOption, TEditorType, TSortFunction } from "@svar-ui/svelte-grid";

import { schemas } from "$lib/client/schemas";

import { getSurrealContext } from "$lib/client/db.context.svelte";

export class DataTable {
	table;
	schema?;
	columns?: IColumn[];
	data?: any[];
	options?: { id: string, label: string }[] = [];
	usePagination = false;
	pagedData: any[] = $state([]);
	pageSize = 15;
	constructor(table: Table, usePagination = false) {
		this.usePagination = usePagination;
		this.table = table;
		this.schema = schemas.get(table.name);
		if (!this.schema) {
			throw new Error(`Schema for table ${table.name} not found`);
		}
		// this.columns = this.getColumns(); // INFO: this should be done in runtime
	}
	async fetchData() {
		const db = getSurrealContext();
		// TODO: handle error
		const [data] = await db?._db.query<any[]>(`select * from ${this.table.name}`);
		// const data = await fetch(`/api/v1/db/tables/?q=${this.table.name}`).then((r) => r.json());
		console.log('data', data);
		this.data = data
		this.pageSize = this.usePagination ? this.pageSize : (this.data?.length ?? 15);
		this.pagedData = this.paginate({ from: 0, to: this.pageSize });
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

	async getSort(api?: IApi) {
		if (!api) return;
		if (!this.schema) return;
		const meta = this.schema.meta();
		if (!meta) return;
		const sort: { key: string, order: "asc" | "desc" } | undefined = meta.sort ?? undefined;
		if (!sort) return;
		if (Array.isArray(sort)) {
			sort.forEach(async (s) => {
				await api.exec("sort-rows", { add: true, ...s });
			});
		}
		else {
			await api.exec("sort-rows", sort);
		}
	}

	async getColumns() {
		if (!this.schema) return [];
		const config = Object.entries(this.schema.shape).map(async ([key, value]) => {
			let column: ColumnBuilder = new ColumnBuilder(key).default();
			const meta = value.meta();
			if (!meta) return column.build();
			const options = meta.table;
			if (meta.column) {
				column.any(meta.column);
			}
			if (options == undefined && (column.column.editor == "combo" || column.column.editor == "richselect")) {
				console.warn("no table for combo/richselect", key);
			}

			if (options != undefined) {
				// TODO: check if table exists? return 404
				const res = await fetch("/api/v1/db/tables?q=" + options).then((r) => r.json());
				const items = res?.data.map((item: z.infer<typeof this.schema>) => ({ id: item.id, label: item.name }));
				column.setComboOptions(items);
				switch (meta.filter) {
					case "richselect":
						column.headerFilter({
							type: "richselect",
							config: {
								options: items,
								template: (i) => i.label,
								placeholder: "Filter",
								handler: (val, fil) => {
									if (fil == "") return true;
									return val == fil
								},
							},
						});
						break;
					case "text":
						column.headerFilter()
						break;
					default:
						break;
				}
			}

			const out = column.build();
			return out;
		});
		const out = await Promise.all(config);
		return out;
	}
}



export class ColumnBuilder {
	column: IColumnConfig = {};
	constructor(key: string) {
		this.column.id = key;
	}
	any(options: IColumn) {
		this.column = { ...this.column, ...options };
		return this;
	}
	hidden() {
		this.column.hidden = true;
		return this;
	}
	header(header?: (string | Partial<IHeaderCell>)[]) {
		this.column.header = header ?? [{ text: this.column.id.charAt(0).toUpperCase() + this.column.id.slice(1) }];
		return this;
	}
	headerFilter(filter?: IHeaderFilter) {
		if (!this.column.header) this.column.header = [];
		if (filter == undefined) filter = { type: "text" };
		if (typeof this.column.header == "string") {
			this.column.header = [{ text: this.column.header, filter }];
		}
		if (Array.isArray(this.column.header)) {
			this.column.header.push({ filter });
		}
		else {
			this.column.header.filter = filter;
		}
		return this;
	}
	sort(sort?: TSortFunction) {
		this.column.sort = sort ?? true;
		return this;
	}
	editor(editor?: Partial<TEditorType>) {
		this.column.editor = editor ?? { type: "text" };
		return this;
	}
	setComboOptions(options: IOption[]) {
		if (!this.column.editor) return this;
		if (options.length == 0) {
			this.column.editor = "text";
			console.warn("no options for selector changing to text", this.column);
			return this;
		}
		switch (typeof this.column.editor) {
			case "string":
				if (this.column.editor == "richselect" || this.column.editor == "combo") {
					this.column.options = options
				}
				break;
			case "object":
				// TODO: this is for semi-custom editor, not implemented right now
				throw new Error("not implemented");
			case "function":
				this.column.options = options;
				break;
			default:
				break;
		}
		return this;
	}
	default() {
		return this.header();
	}

	build() {
		return this.column;
	}

}
