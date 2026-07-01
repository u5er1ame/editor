import type { ClientSchemas } from "$lib/model/schemas";
import { ColumnBuilder } from "$lib/builders/column.svelte";
import type { IColumn } from "@svar-ui/svelte-grid";

export function addMetadata(schema: ClientSchemas) {
	const meta: { table: IColumn[] } = {
		table: []
	}
	for (const key of Object.keys(schema.shape)) {
		let col: IColumn;
		switch (key) {
			case "id":
					col = ColumnBuilder.hidden(key).getter((val)=>val.toString()).build()
				break;
			case "name":
				if (schema.shape[key].type != "string") throw new Error(`${key} type isnt string?`);
				col = ColumnBuilder.default(key).headerFilter("text").build()
				break;
			case "level":
				if (schema.shape[key].type == "object") {
							col = ColumnBuilder.defaultWithKey(key, "name").build()
				}
				else {
							col = ColumnBuilder.default(key).build()
				}
			break;
			case "shop":
				if (schema.shape[key].type == "object") {
							col = ColumnBuilder.defaultWithKey(key, "name").build()
				}
				else {
							col = ColumnBuilder.default(key).build()
				}
			break;
			case "room":
				if (schema.shape[key].type == "object") {
							col = ColumnBuilder.defaultWithKey(key, "name").build()
				}
				else {
							col = ColumnBuilder.default(key).build()
				}
			break;
			case "board":
				if (schema.shape[key].type == "object") {
							col = ColumnBuilder.defaultWithKey(key, "name").template((val)=>`${val.room.name} ${val.name}`).build()
				}
				else {
							col = ColumnBuilder.default(key).build()
				}
			break;
			case "in": //record
			// break;
			case "out": // record
			// break;
			case "cable": // string/number
			// break;
			default:
							col = ColumnBuilder.default(key).build()
			break;
		}
		meta.table.push(col);
	}
	return meta;
}
