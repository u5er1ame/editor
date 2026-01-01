import type { Edge, EdgeProps, EdgeTypes, Node, NodeProps, NodeTypes, SvelteFlowProps } from "@xyflow/svelte";
import { RecordId, type Prettify, type ActionResult, type QueryResult, type Table, StringRecordId, jsonify } from "surrealdb";
import defaults from "./utils";
import type { Dimensions, NodeBounds, XYPosition } from "@xyflow/system";

type DBRecord<T> = ActionResult<Prettify<T>>;

type NodeDimensions = Partial<Dimensions & { position: XYPosition }>;

export class GraphBase {
	nodes: Node[] = [];
	edges: Edge[] = [];

	constructor() {
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

	setParentId(parent: Node<any>, child: Node<any>, expand = false) {
		child.extent = "parent";
		child.parentId = parent.id;
		child.expandParent = expand;
	}

	sur2flow<T extends Prettify<any>>(data: ActionResult<T>, opts: NodeDimensions = defaults) {
		const type: string = data.id.tb.toString();
		opts = { ...defaults, ...opts };
		return {
			id: data.id.toString(),
			width: opts.width,
			height: opts.height,
			position: opts.position,
			connectable: false,
			type,
			data
		}
	}

	flow2sur<T extends Pick<Node, "id" | "data">>(node: T) {
		const id = new StringRecordId(node.id);
		return jsonify({
			id,
			...node.data
		})
	}
}
