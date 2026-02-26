import * as Custom from "$lib/components/nodes";
import { default as Edges } from "$lib/components/edges";
import type { Node, Dimensions, Edge, NodeTypes, XYPosition, NodeProps, EdgeTypes } from "@xyflow/svelte";
import type { NodeBase } from "@xyflow/system";
import type { ElkLayoutAlgorithmDescription, ElkNode, LayoutOptions } from "elkjs/lib/elk-api";
import { xy2elk } from "./client/utls";

import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import type { ActionResult } from "surrealdb";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export type NodeDimensions = Dimensions & { position: XYPosition };

export default {
	type: "group",
	width: 128,
	height: 128,
	position: { x: 0, y: 0 },
}
// INFO: type infered from id.tb (table name)
export const roomDimensions = {
	width: 128,
	height: 128,
	position: { x: 0, y: 0 },
}

export const boardDimensions = {
	width: 64,
	height: 64,
	position: { x: 0, y: 0 },
}

export const breakerDimensions = {
	width: 20,
	height: 20,
	position: { x: 0, y: 0 },
}

export type FlowOptions = {
	nodeTypes: NodeTypes,
	edgeTypes: EdgeTypes,
	dimensions: { [key: string]: NodeDimensions },
	flowOptions: { [key: string]: Omit<NodeBase, "id" | "data" | "type" | "position"> },
	layoutOptions: { [key: string]: LayoutOptions },
};
export const Flow: FlowOptions = {
	nodeTypes: {
		electric_rooms: Custom.Rewrite.Room,
		boards: Custom.Rewrite.Board,
		breakers: Custom.Rewrite.Breaker,
		root_breakers: Custom.Rewrite.Breaker,
		// INFO: these nodes created by user and not saved in db yet
		unsaved_boards: Custom.Rewrite.Board,
		unsaved_breakers: Custom.Rewrite.Breaker,
		unsaved_root_breakers: Custom.Rewrite.Breaker,
	},
	edgeTypes: {
		inbound: Edges.Inbound,
		outbound: Edges.Outbound,
	},
	dimensions: {
		electric_rooms: roomDimensions,
		boards: boardDimensions,
		breakers: breakerDimensions,
		root_breakers: breakerDimensions,
		unsaved_boards: boardDimensions,
		unsaved_breakers: breakerDimensions,
		unsaved_root_breakers: breakerDimensions,
	},
	flowOptions: {
		electric_rooms: {
			connectable: false,
			deletable: false,
			expandParent: true,
			extent: "parent",
			ariaLabel: "Room",
			zIndex: 1,
		},
		boards: {
			connectable: false,
			draggable: true,
			expandParent: true,
			extent: "parent",
			zIndex: 2,
		},
		breakers: {
			connectable: true,
			draggable: true,
			expandParent: true,
			extent: "parent",
			zIndex: 9,
		},
		root_breakers: {
			connectable: true,
			draggable: false,
			expandParent: true,
			extent: "parent",
			zIndex: 9,
		},
	},
	layoutOptions: {
		electric_rooms: {
			"elk.algorithm": "rectpacking",
			"elk.direction": "DOWN",
			"hierarchyHandling": "INCLUDE_CHILDREN"
		},
		boards: {
			"elk.algorithm": "layered",
			"elk.direction": "RIGHT",
			"hierarchyHandling": "INCLUDE_CHILDREN"
		},
		breakers: {
			"elk.algorithm": "layered",
			"hierarchyHandling": "INCLUDE_CHILDREN"
		},
		root_breakers: {
			"elk.algorithm": "layered",
			"elk.direction": "DOWN",
			"hierarchyHandling": "INCLUDE_CHILDREN"
		},
	},
};

export function toNode(item: ActionResult<{}>, parentId_filedName?: string): Node {
	return {
		id: item.id.toString(),
		type: item.id.tb,
		data: item,
		parentId: parentId_filedName ? item[parentId_filedName].toString(): undefined,
		initialWidth: Flow.dimensions[item.id.tb].width,
		initialHeight: Flow.dimensions[item.id.tb].height,
		...Flow.dimensions[item.id.tb],
		...Flow.flowOptions[item.id.tb],
	}
}

export function splitByParent(nodes: Node[]): Record<string, Node[]> {
	const out: Record<string, Node[]> = {};
	for (const node of nodes) {
		if (node.type == undefined) {
			// TODO: throw?
			continue;
		}
		if (out[node.type] == undefined) {
			out[node.type] = [];
		}
		out[node.type].push(node);
	}
	return out;
}

export function toElk(rooms: Node[], boards: Node[], breakers: Node[]) {
	const root: ElkNode[] = rooms.map((r: Node)=>{
		const childs = boards.filter((b: Node)=>b.parentId == r.id).map((board: Node)=>{
			const childs = breakers.filter((breaker: Node)=>breaker.parentId == board.id).map(xy2elk);
			const item = xy2elk(board);
			item.layoutOptions = Flow.layoutOptions[board.type];
			item.children = childs;
			return item;
		});
		const item = xy2elk(r);
		item.layoutOptions = Flow.layoutOptions[r.type];
		item.children = childs;
		return item;
	});
	return {
		id: 'root',
		children: root,
	}
}

type ElkWithData = ElkNode & Partial<{ type: string, data: any }>

export function elk2flow(elk: ElkWithData, parentId?: string): Node | Node[] {
	if (!elk.type) {
		elk.type = "default";
	}
	const dimensions = Flow.dimensions[elk.type]; // TODO: this could error
	const position = {
		x: elk.x || dimensions.position.x,
		y: elk.y || dimensions.position.y,
	};
	let flow: Node = {
		id: elk.id,
		parentId,
		extent: parentId ? "parent" : null,
		width: elk.width || dimensions.width,
		height: elk.height || dimensions.height,
		position,
		data: elk.data,
		type: elk.type,
		...Flow.flowOptions[elk.type], // TODO: fix type
	};
	if (elk.edges) {
		// TODO: they pretty similar
	}

	let tree: Array<Node[]> | Node[] = [flow];
	if (!elk.children || elk.children.length === 0) {
		// nodes.push(flow);
		return tree;
	}

	for (const node of elk.children) {
		const item = elk2flow(node, elk.id)
		tree.push(item);
	}
	return tree.flat();
	// return { nodes, edges };
	// return flow;
}
