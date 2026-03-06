import { Table } from "surrealdb";
import type { IColumn } from "@svar-ui/svelte-grid";

export class DataTable {
	schema: unknown;
	columns: IColumn[];
	constructor(table: Table) {
		console.log(table.toString());
	}
}
