import type { Edge, Node, NodeProps } from '@xyflow/svelte';
import type { EdgeData, ServerData } from '$lib/model/schemas';
import type { ElkNode, LayoutOptions } from 'elkjs/lib/elk-api';
import type { EdgeBase } from '@xyflow/system';


export class GraphViewController {
	static toNode(item: ServerData, parentId_filedName?: keyof ServerData, nodeProps?: Omit<NodeBase, "id" | "data" |  "position">): Node {
		if (!item.id) throw new Error("Cant find id");
		let type = item.id.toString().split(":")[0] ?? "default";
		return {
			id: item.id.toString(),
			type: nodeProps?.type ?? type,
			data: {
				raw: item,
				labelKey: nodeProps?.labelKey ?? "name",
			},
			parentId: parentId_filedName ? item[parentId_filedName].toString() : undefined,
			position: { x: 0, y: 0 },
			...nodeProps
		}
	}
	static toEdge(item: EdgeData & {[key: string]: any}, edgeProps?: Omit<EdgeBase, "id" | "data" | "source" | "target">): Edge {
		if (!item.id) throw new Error("Cant find id");
		let type = item.id.toString().split(":")[0] ?? "default";
		return {
			id: item.id.toString(),
			type: edgeProps?.type ?? type,
			data: item,
			source: item.in.toString(),
			target: item.out.toString(),
			...edgeProps
		}
	}
	static xy2elk(node: Node): ElkNode {
		return {
			id: node.id,
			children: [] as ElkNode[],
			x: node.position?.x || 0,
			y: node.position?.y || 0,
			width: node.measured?.width || node.width,
			height: node.measured?.height || node.height,
			// layoutOptions: this.getLayoutOptions(node)
		}
	}

	static sortNodesForSvelteFlow(nodes: Node[]): Node[] {
		const childrenMap = new Map<string, Node[]>();
		const roots: Node[] = [];

		for (const node of nodes) {
			if (!node.parentId) {
				roots.push(node);
			} else {
				if (!childrenMap.has(node.parentId)) {
					childrenMap.set(node.parentId, []);
				}
				childrenMap.get(node.parentId)!.push(node);
			}
		}

		const sortedNodes: Node[] = [];
		const queue: Node[] = [...roots];

		while (queue.length > 0) {
			const current = queue.shift()!;
			sortedNodes.push(current);

			const children = childrenMap.get(current.id);
			if (children) {
				queue.push(...children);
			}
		}

		// Если в базе есть "битые" узлы со ссылкой на несуществующий parentId,
		// пушим их в конец, чтобы данные не потерялись
		if (sortedNodes.length < nodes.length) {
			const sortedIds = new Set(sortedNodes.map(n => n.id));
			for (const node of nodes) {
				if (!sortedIds.has(node.id)) {
					sortedNodes.push(node);
				}
			}
		}

		return sortedNodes;
	}
}
