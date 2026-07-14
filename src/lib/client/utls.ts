// import { Flow } from "$lib/utils";
import type { Node } from "@xyflow/svelte";
import type { ElkNode } from "elkjs/lib/elk-api";


export function findParent(nodes: Node[], parentId: string): Node | undefined {
	for (const node of nodes) {
		if (node.id === parentId) {
			return node;
		}
	}
}

// export function flatToNested(items: Node[]) {
// 	let lookup = new Map<string,ElkNode | ElkNode[]>([]);
//
// 	const base = new Map<string,ElkNode>([]);
// 	const childs = items.filter(i=>i.parentId);
//
// 	console.log("childs", childs);
// 	for (const item of items) {
// 		const parentId = item.parentId;
// 		if (parentId === undefined) {
// 			lookup.set(item.id,xy2elk(item));
// 			continue;
// 		}
//
// 		let node = lookup.find(n=>n.id == parentId)
//
//
// 		if (node == undefined) { // check base for parentId
// 			let node = base.get(parentId);
// 			if (node == undefined) {
// 				console.log("node undefined!", parentId);
// 				continue;
// 			}
// 			if (node.children == undefined) {
// 				node.children = [];
// 			}
// 			node.children.push(xy2elk(item));
// 			base.set(parentId, node);
// 			continue;
// 		}
// 		if (node.children == undefined) {
// 			node.children = [];
// 		}
// 		node.children.push(xy2elk(item));
// 		// FIXME: repeated logic
// 		if(base.has(parentId)) {
// 			let node = base.get(parentId);
// 			if (node!.children == undefined) {
// 				node!.children = [];
// 			}
// 			node!.children.push(xy2elk(item));
// 			base.set(parentId, node!);
// 			continue;
// 		}
// 	}
//
// 	return base.values().toArray();
// }

// Transform nested array back to flat array with parentId
// export function nestedToFlat(nested, parentId = null, result = []) {
//   for (const item of nested) {
//     // Clone item and add parentId
//     const flatItem = { ...item, parentId, children: undefined };
//     result.push(flatItem);
//
//     // Recursively process children
//     if (item.children && item.children.length > 0) {
//       nestedToFlat(item.children, item.id, result);
//     }
//   }
//
//   return result;
// }

// export function xy2elk(node: Node): ElkNode {
// 	return {
// 		id: node.id,
// 		children: [] as ElkNode[],
// 		x: node.position?.x || 0,
// 		y: node.position?.y || 0,
// 		width: node.measured?.width || node.width,
// 		height: node.measured?.height || node.height,
// 		layoutOptions: Flow.layoutOptions[node.type]
// 	}
// }

export function findChildren(nodes: ElkNode, id: string): ElkNode | undefined {
	if (!nodes.children) {
		return;
	}
	for (const node of nodes.children) {
		if (node.id === id) {
			return node;
		}
		if (node.children) {
			const child = findChildren(node, id);
			if (child) {
				return child;
			}
		}
	}
	return;
}
