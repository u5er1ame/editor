import type { Edge, Node } from "@xyflow/svelte";
// import defaults, { Flow, type NodeDimensions } from "$lib/utils";
import type { ElkNode } from "elkjs";


export class GraphBase {
	nodes: Node[] = [];
	edges: Edge[] = [];
	elkRoot: ElkNode = {
		id: "root",
		children: [],
		layoutOptions: {
			"elk.algorithm": "force",
			"elk.direction": "RIGHT",
		}
	};

	constructor() {
	}

	static addElkChildren(target: ElkNode | ElkNode[], parent: ElkNode) {
		if (!parent.children) {
			parent.children = [];
		}
		if (Array.isArray(target)) {
			parent.children = parent.children.concat(target);
		}
		else {
			parent.children.push(target);
		}
	}

	addNode<T extends Node>(node: T) {
		this.nodes.push(node);
	}
	addNodes<T extends Node>(nodes: T[]) {
		this.nodes.push(...nodes);
	}

	addEdge<T extends Edge>(edge: T) {
		this.edges.push(edge);
	}
	addEdges<T extends Edge>(edges: T[]) {
		this.edges.push(...edges);
	}

	static setParentId(parent: Node<any>, child: Node<any>, expand = false) {
		child.extent = "parent";
		child.parentId = parent.id;
		child.expandParent = expand;
	}

	// static getDimensions(type: string): NodeDimensions {
	// 	if (type in Flow.dimensions) {
	// 		return Flow.dimensions[type];
	// 	}
	// 	return defaults;
	// }

	// static sur2elkN<T extends Prettify<any>>(data: ActionResult<T>): ElkNode & { type: string, data: any } {
	// 	const type: string = data.id.tb.toString();
	// 	let dimensions: NodeDimensions = GraphBase.getDimensions(type);
	// 	const layoutOptions = Flow.layoutOptions[type]; // TODO: fix type
	// 	return {
	// 		id: data.id.toString(),
	// 		children: [],
	// 		width: dimensions.width,
	// 		height: dimensions.height,
	// 		x: dimensions.position.x,
	// 		y: dimensions.position.y,
	// 		data,
	// 		type,
	// 		layoutOptions
	// 	}
	// }
	//
	// static sur2elkE<T extends Prettify<any>>(data: ActionResult<T>): ElkExtendedEdge {
	// 	const type: string = data.id.tb.toString();
	// 	let sources = data.in;
	// 	let targets = data.out;
	// 	// FIXME: this check looks meh
	// 	if (!Array.isArray(data.in)) {
	// 		sources[0] = data.in;
	// 	}
	// 	if (!Array.isArray(data.out)) {
	// 		targets[0] = data.out;
	// 	}
	// 	return {
	// 		id: data.id.toString(),
	// 		sources: sources.map((id: RecordId) => id.toString()),
	// 		targets: targets.map((id: RecordId) => id.toString()),
	// 	}
	// }
	//
	// static sur2flow<T extends Prettify<any>>(data: ActionResult<T>, nodeOpts?: Partial<Omit<NodeProps, "id" | "data" | "type">>): Node<any> {
	// 	const type: string = data.id.tb.toString();
	// 	nodeOpts ={...Flow.flowOptions[type], ...nodeOpts }; // TODO: fix type
	// 	let dimensions: NodeDimensions = GraphBase.getDimensions(type);
	// 	return {
	// 		id: data.id.toString(),
	// 		type,
	// 		data,
	// 		...nodeOpts,
	// 		...dimensions
	// 	}
	// }
	//
	// static flow2sur<T extends Pick<Node, "id" | "data">>(node: T) {
	// 	const id = new StringRecordId(node.id);
	// 	return jsonify({
	// 		id,
	// 		...node.data
	// 	})
	// }
}
