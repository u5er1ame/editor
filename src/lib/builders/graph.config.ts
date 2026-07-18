import type { AllKeys, ServerData } from "$lib/model/schemas";
import { error } from "@sveltejs/kit";
import type { EdgeBase, NodeBase } from "@xyflow/system";
import type { LayoutOptions } from "elkjs/lib/elk-api";
import type { Component } from "svelte";

export interface GraphConfig {
	type: "node" | "edge";
	component: Component;
	parentIdKey: Omit<AllKeys<ServerData>, "id">;
	labelKey: string;
	// prio: number;
	elkConfig: Partial<LayoutOptions>;
	flowConfig: Omit<NodeBase, "id" | "data" | "position">;
};

export class GraphConfigBuilder {
	private _config: Partial<GraphConfig>;

	defaultFlowConfig: Partial<NodeBase> = {
		hidden: false,
		connectable: false,
		draggable: true,
		extent: "parent",
		expandParent: true,
	}

	defaultElkConfig: Partial<LayoutOptions> = {
		'elk.algorithm': 'layered',
		'elk.direction': 'RIGHT',
		'elk.padding': '[top=20,left=20,bottom=20,right=20]',
		'elk.spacing.nodeNode': '30',
		'org.eclipse.elk.json.edgeCoords': 'PARENT'
	};

	constructor(type?: "node" | "edge") {
		this._config = { type };
	}

	get config() {
		return this._config;
	}

	type(type: "node" | "edge") {
		this._config.type = type;
		return this;
	}
	component(type: string, comp: Component) {
		this._config.component = comp;
		this.flowConfig({ type });
		return this;
	}
	// prio(prio: number) {
	// 	this._config.prio = prio;
	// 	return this;
	// }
	labelKey(key: string) {
		this._config.labelKey = key;
		return this;
	}
	parentIDKey(key: string) {
		this._config.parentIdKey = key;
		return this;
	}
	elkConfig(config?: LayoutOptions) {
		this._config.elkConfig = config ?? this.defaultElkConfig;
		return this;
	}
	// WARN: hidden by default until layout calculated
	flowConfig(config?: Omit<NodeBase | EdgeBase, "id" | "data" |  "position">) {
		this._config.flowConfig = { ...this.defaultFlowConfig, ...this._config.flowConfig, ...config };
		return this;
	}

	build() {
		if (this._config.type == undefined) error(401,"Config error: Type not set");
		// INFO: edge type/component sets in runtime (not ok for perf but for now....)
		if (this._config.type == "node" && this._config.component == undefined) error(501,"Config error: Component not set for " + this._config.type);
		// if (this._config.type == "node" && this._config.prio == undefined) error(501,["Config error: Priority unknown for", this._config.type, this._config?.flowConfig?.type].join(" "))
		return this.config;
	}
	static node() {
		return new GraphConfigBuilder("node");
	}
	static edge() {
		return new GraphConfigBuilder("edge");
	}
}
