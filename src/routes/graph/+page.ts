import { error } from "@sveltejs/kit";
import { schemaStore, type ClientData, type EdgeData, type ModelRegistry, type ServerData } from "$lib/model/schemas";
import type { BaseConfig } from "$lib/model/types";
import type { PageLoad, PageServerData } from "./$types";
import { baseConfigStore } from "$lib/controller/config_store.svelte";
import { addFieldsMetadata, addTableMetadata } from "$lib/builder";
import { browser } from "$app/env";
import { getData } from "$lib/db.remote";
import type { Node, Edge, NodeTypes } from "@xyflow/svelte";
import { GraphViewController } from "$lib/view/graph.svelte";
import type { Component } from "svelte";

export const load: PageLoad = async ({data, parent, params,  url,  fetch }): Promise<PageServerData> => {
	const config: BaseConfig[] = []
	let records: ServerData[] = [];
	let nodes: Node[] = [];
	let nodeTypes: {[key: string]: Component} = {};
	let edges: Edge[] = [];
	let edgeTypes: {[key: string]: Component} = {};
	for (const table of data.tables.info.tables) {
		if (!schemaStore.store.has(table.name)) {
			error(404, "Cant find schema for table: " + table.name);
		}
		else {
			const schemas: ModelRegistry = schemaStore.store.get(table.name)!;
			if (!baseConfigStore.base.has(schemas.client)) {
				console.warn('no config for schema', table.name, "using default");
				const default_config = schemaStore.defaultConfig(table.name);
				baseConfigStore.addConfig(schemas.client, default_config); // WARN: idk should i do it?
			}
			let meta = addTableMetadata(table.name);
			if (meta.graph) {
				const val = await getData(table.name).catch(()=>{});
				if (val && val.length > 0) {
					records = records.concat(val);
					if (meta.graph.type == "node") {
						nodeTypes[table.name] = meta.graph.component;
						val.forEach((item)=>{
							const node = GraphViewController.toNode(item, meta.graph);
							nodes.push(node);
						});
					}
					if (meta.graph.type == "edge") {
						edgeTypes[table.name] = meta.graph.component;
						val.forEach((item)=>{
							item = item as EdgeData;
							const edge = GraphViewController.toEdge(item, meta.graph)
							edges.push(edge);
						});
					}
				}
			}
			// WARN: base config should exist at this point add only view config
			baseConfigStore.addViewConfig(schemas.client, meta);
			meta = addFieldsMetadata(schemas.client);
			baseConfigStore.addViewConfig(schemas.client, meta);
			config.push(baseConfigStore.base.get(schemas.client)!)
		}
	}
	nodes = GraphViewController.sortNodesForSvelteFlow(nodes);
	return { tables: { config, ...data.tables }, raw: records, nodes: nodes, nodeTypes: nodeTypes, edges: edges, edgeTypes: edgeTypes, ...data };
};
