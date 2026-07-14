import { schemaStore, type ClientSchemas } from "$lib/model/schemas";
import { Rewrite } from "$lib/components/nodes/index";
import { ColumnBuilder } from "$lib/builders/column.svelte";
import { GraphConfigBuilder } from "$lib/builders/graph.config";
import type { IColumn } from "@svar-ui/svelte-grid";
import type { Views } from "./model/types";
import type { LayoutOptions } from "elkjs/lib/elk-api";

export function getLayoutOptions(table: string): LayoutOptions | undefined {
	switch (table) {
		case "electric_rooms":
			return {
				'elk.algorithm': 'layered',
				'elk.direction': 'DOWN',
				'elk.padding': '[top=50,left=30,bottom=30,right=30]',
				'elk.spacing.componentComponent': '40'
			};
		case "board":
			return {
				'elk.algorithm': 'layered',
				'elk.direction': 'RIGHT',
				'elk.padding': '[top=40,left=20,bottom=20,right=20]',
				'elk.spacing.nodeNode': '30'
			};
		case "breakers":
		default:
			return undefined;
	}
}

export function addTableMetadata(name: string) {
	const schema = schemaStore.store.get(name)!;
	if (!schema) throw new Error("Schema not found");
	const meta: {[key in Views]?: any} = {
		graph: undefined,
	}
	const elkConfig = getLayoutOptions(name)
	const builder = new GraphConfigBuilder().labelKey("name").elkConfig(elkConfig).flowConfig();
	switch(name) {
		case "levels":
		break;
		case "area_name":
		break;
		case "shops":
		break;
		case "electric_rooms":
			meta.graph = builder.type("node").component(name, Rewrite.Room).build();
		break;
		case "boards":
			meta.graph = builder.type("node").parentIDKey("room").component(name, Rewrite.Board).build();
		break;
		case "breakers":
			meta.graph = builder.type("node").flowConfig({connectable: true}).parentIDKey("board").component(name, Rewrite.Breaker).build();
		break;
		case "connects":
			meta.graph = builder.type("edge").build();
		break;
		default:
			throw new Error("Unknown table");
	}
	return meta;
}

export function addFieldsMetadata(schema: ClientSchemas) {
	const meta: {[key in Views]?: any} = {
		table: [],
	}
	for (const key of Object.keys(schema.shape)) {
		let col: IColumn;
		switch (key) {
			case "id":
				col = ColumnBuilder.hidden(key).build()
				break;
			case "name":
				if (schema.shape[key].type != "string") throw new Error(`${key} type isnt string?`);
				col = ColumnBuilder.default(key).headerFilter("text").build()
				break;
			case "level":
				if (schema.shape[key].type == "object") {
							col = ColumnBuilder.defaultWithKey(key, "name").editor("select").addEditorProps({fetchTable: "levels", labelKey: "name", valueKey: "id"}).build()
				}
				else {
							col = ColumnBuilder.default(key).build()
				}
			break;
			case "shop":
				if (schema.shape[key].type == "object") {
							col = ColumnBuilder.defaultWithKey(key, "name").editor("combo").addEditorProps({fetchTable: "shops", labelKey: "name", valueKey: "id"}).build()
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
