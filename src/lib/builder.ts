import { schemaStore, type ClientSchemas } from "$lib/model/schemas";
import { Rewrite } from "$lib/components/nodes/index";
import { ColumnBuilder } from "$lib/builders/column.svelte";
import { GraphConfigBuilder } from "$lib/builders/graph.config";
import type { IColumn } from "@svar-ui/svelte-grid";
import type { Tables, Views } from "./model/types";
import type { LayoutOptions } from "elkjs/lib/elk-api";


export function getLayoutOptions(table: string): LayoutOptions | undefined {
	switch (table) {
		case "electric_rooms":
			return {
				'elk.algorithm': 'layered',
				'elk.direction': 'DOWN',
				"hierarchyHandling": "INCLUDE_CHILDREN",
				'elk.padding.top': '16',
				'elk.padding.left': '16',
				'elk.padding.bottom': '16',
				'elk.padding.right': '16',
				'elk.contentAlignment': 'V_CENTER H_CENTER',
				'elk.layered.nodePlacement.bk.fixedAlignment': 'BALANCED',
				'elk.spacing.nodeNode': '16'
			};

		case "board":
			return {
				'elk.algorithm': 'layered',
				'elk.direction': 'RIGHT',
				"hierarchyHandling": "INCLUDE_CHILDREN",
				'elk.padding.top': '40',
				'elk.padding.left': '20',
				'elk.padding.bottom': '20',
				'elk.padding.right': '20',
				'elk.contentAlignment': 'V_CENTER H_CENTER',
				'elk.layered.nodePlacement.bk.fixedAlignment': 'BALANCED',
				'elk.spacing.nodeNode': '30'
			};

		case "breakers":
		default:
			return {
				'elk.algorithm': 'layered',
				'elk.direction': 'DOWN',
				'elk.edgeRouting': 'POLYLINE',
				'elk.padding.top': '10',
				'elk.padding.left': '10',
				'elk.padding.bottom': '10',
				'elk.padding.right': '10',
				'elk.contentAlignment': 'V_CENTER H_CENTER',
				'elk.layered.nodePlacement.bk.fixedAlignment': 'BALANCED',
				'elk.spacing.nodeNode': '20'
			};
	}
}

export function addTableMetadata(name: Tables) {
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
			meta.graph = builder.type("edge").flowConfig({animated: true}).build();
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
							col = ColumnBuilder.defaultWithKey(key, "name").editor("select").addEditorProps({fetchTable: "electric_rooms", labelKey: "name", valueKey: "id"}).build()
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
