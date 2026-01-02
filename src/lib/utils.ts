import * as Custom from "$lib/components/nodes";
import type { Node, Dimensions, Edge, NodeTypes, XYPosition } from "@xyflow/svelte";
import type { ElkNode } from "elkjs/lib/elk-api";

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
	width: 32,
	height: 32,
	position: { x: 0, y: 0 },
}

export const breakerDimensions = {
	width: 16,
	height: 16,
	position: { x: 0, y: 0 },
}

export const Flow: { nodeTypes: NodeTypes, dimensions: { [key: string]: NodeDimensions } } = {
	nodeTypes: {
		electric_rooms: Custom.Room,
		boards: Custom.Board,
		breakers: Custom.Breaker,
		root_breakers: Custom.RootBreaker,
	},
	dimensions: {
		electric_rooms: roomDimensions,
		boards: boardDimensions,
		breakers: breakerDimensions,
		root_breakers: breakerDimensions,
	},
	flowOptions: {
		electric_rooms: {
			isConnectable: false,
		},
		boards: {
			isConnectable: false,
			draggable: false,
			expandParent: true,
		},
		breakers: {
			isConnectable: true,
			draggable: false,
		},
		root_breakers: {
			isConnectable: true,
			draggable: false,
		},
	},
	layoutOptions: {
		electric_rooms: {
			"elk.algorithm": "rectpacking",
			"elk.direction": "DOWN",
		},
		boards: {
			"elk.algorithm": "rectpacking",
			"elk.direction": "RIGHT",
		},
		breakers: {
			"elk.algorithm": "layered",
		},
		root_breakers: {
			"elk.algorithm": "layered",
			"elk.direction": "DOWN",
		},
	},
};


let nodes: Node[] = [];
let edges: Edge[] = [];

export function elk2flow(elk: ElkNode & { type: string, data: any }, parentId?: string) {
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

	let tree = [flow];
	if (!elk.children || elk.children.length === 0) {
		// nodes.push(flow);
		return tree;
	}

	for (const node of elk.children) {
		tree.push(elk2flow(node, elk.id));
	}
	return tree.flat();
	// return { nodes, edges };
	// return flow;
}
