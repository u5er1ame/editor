import { error } from "@sveltejs/kit";
import type { Component } from "svelte";
import type { Node, Edge } from "@xyflow/svelte";
import type { PageLoad, PageServerData } from "./$types";
import { schemaStore, type EdgeData, type ModelRegistry, type ServerData } from "$lib/model/schemas";
import type { BaseConfig } from "$lib/model/types";
import { baseConfigStore } from "$lib/controller/config_store.svelte";
import { addFieldsMetadata, addTableMetadata } from "$lib/builder";
import { getData } from "$lib/db.remote";
import { GraphViewController } from "$lib/view/graph.svelte";
import Edges  from "$lib/components/edges"


export const load: PageLoad = async ({data, parent, params,  url,  fetch }): Promise<PageServerData> => {
	const config: BaseConfig[] = []
	let records: ServerData[] = [];

	for (const table of data.tables.info.tables) {
		if (!schemaStore.store.has(table.name)) {
			error(404, "Cant find schema for table: " + table.name);
		}
		const schemas: ModelRegistry = schemaStore.store.get(table.name)!;
		if (!baseConfigStore.base.has(schemas.client)) {
			console.warn('no config for schema', table.name, "using default");
			const default_config = schemaStore.defaultConfig(table.name);
			baseConfigStore.addConfig(schemas.client, default_config); // WARN: idk should i do it?
		}
	}

	let nodes: Node[] = [];
	let nodeTypes: {[key: string]: Component} = {};
	const node_tables = data.tables.info.tables.filter((t: any)=>t.kind.kind !="RELATION");

	for (const table of node_tables) {
		let meta = addTableMetadata(table.name);
		if (!meta.graph) continue;
		const schemas: ModelRegistry = schemaStore.store.get(table.name)!;
		const val = await getData(table.name).catch(()=>{});
		if (val && val.length > 0) {
			records = records.concat(val);
			if (meta.graph.type == "edge") {
				error(422, "Edge type config in node-like table please check table type and/or config validity");
			}
			if (meta.graph.type != "node") error(400, "Unexpected graph type");
			nodeTypes[table.name] = meta.graph.component;
			val.forEach((item)=>{
				const node = GraphViewController.toNode(item, meta.graph);
				nodes.push(node);
			});
		}
		// WARN: base config should exist at this point add only view config
		baseConfigStore.addViewConfig(schemas.client, meta);
		meta = addFieldsMetadata(schemas.client);
		baseConfigStore.addViewConfig(schemas.client, meta);
		config.push(baseConfigStore.base.get(schemas.client)!)
	}

	const node_map = new Map(nodes.map(n=>[n.id,n]));

	let edges: Edge[] = [];
	let edgeTypes: {[key: string]: Component} = {};
	const edge_tables = data.tables.info.tables.filter(t=>t.kind.kind =="RELATION");
	for (const table of edge_tables) {
		let meta = addTableMetadata(table.name);
		if (!meta.graph) continue;
		const schemas: ModelRegistry = schemaStore.store.get(table.name)!;
		const val = await getData(table.name).catch(()=>{});
		if (val && val.length > 0) {
			records = records.concat(val);
			if (meta.graph.type == "node") {
				error(422, "Node type config in edge-like table please check table type and/or config validity");
			}
			if (meta.graph.type != "edge") error(400, "Unexpected graph type");
			val.forEach((item)=>{
				item = item as EdgeData;
				const in_parent =  node_map.get(item.in.toString())?.parentId;
				const out_parent =  node_map.get(item.out.toString())?.parentId;
				if (in_parent && out_parent && in_parent == out_parent) { edgeTypes.inbound = Edges.Inbound; meta.graph.flowConfig.type = "inbound" }
				else { edgeTypes.outbound = Edges.Outbound; meta.graph.flowConfig.type = "outbound" }
				const edge = GraphViewController.toEdge(item, meta.graph)
				edges.push(edge);
			});
		}
		// WARN: base config should exist at this point add only view config
		baseConfigStore.addViewConfig(schemas.client, meta);
		meta = addFieldsMetadata(schemas.client);
		baseConfigStore.addViewConfig(schemas.client, meta);
		config.push(baseConfigStore.base.get(schemas.client)!)
	}
	nodes = GraphViewController.sortNodesForSvelteFlow(nodes);
	return { tables: { config, ...data.tables }, raw: records, nodes: nodes, nodeTypes: nodeTypes, edges: edges, edgeTypes: edgeTypes, ...data };
};
