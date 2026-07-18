import type { Edge, Node, NodeProps } from '@xyflow/svelte';
import type { EdgeData, ServerData } from '$lib/model/schemas';
import type { ElkNode, LayoutOptions, ElkExtendedEdge, ElkGraphElement } from 'elkjs/lib/elk-api';
import { getLayoutOptions } from '$lib/builder';
import type { GraphConfig, GraphConfigBuilder } from '$lib/builders/graph.config';


export class GraphViewController {
	static toNode(item: ServerData, config: GraphConfig): Node {
		if (!item.id) throw new Error("Cant find id");
		let type = item.id.toString().split(":")[0] ?? "default";
		return {
			id: item.id.toString(),
			type: config.type ?? type,
			data: {
				raw: item,
				labelKey: config.labelKey ?? "name",
			},
			parentId: config.parentIdKey ? item[config.parentIdKey].toString() : undefined,
			position: { x: 0, y: 0 },
			...config.flowConfig
		}
	}
	static toEdge(item: EdgeData & {[key: string]: any}, config: GraphConfig): Edge {
		if (!item.id) throw new Error("Cant find id");
		let type = item.id.toString().split(":")[0] ?? "default";
		return {
			id: item.id.toString(),
			type: config.type ?? type,
			data: { raw: item,},
			source: item.in.toString(),
			target: item.out.toString(),
			...config.flowConfig
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
			edges: [],
			layoutOptions: getLayoutOptions(node.type!)
		}
	}
	static elkEdge2xy(edge: ElkExtendedEdge): Edge {
		return {
			id: edge.id,
			source: edge.sources[0],
			target: edge.targets[0],
		}
	}
	/// this is bs
	static elk2xy(node: ElkNode): Map<string, Partial<Node>> {
		const out: Map<string, Partial<Node>> = new Map();
		const add = (node: ElkNode) => {
			out.set(node.id, {
				id: node.id,
				position: { x: node.x || 0, y: node.y || 0 },
				width: node.width ,
				height: node.height,
			});
			if (node.children && node.children.length > 0) {
				for (const child of node.children) {
					add(child);
				}
			}
		}
		if (node.children && node.children.length > 0) {
			for (const child of node.children) {
				add(child);
			}
		}
		return out;
	}

	private static findLca(
	  sourceId: string,
	  targetId: string,
	  itemMap: Map<string, any>,
	  rootId: string
	): string {
	  if (sourceId === targetId) return sourceId;

	  const ancestors = new Set<string>();
	  let current = itemMap.get(sourceId);
	  while (current) {
		ancestors.add(current.id);
		current = current._rawParentId ? itemMap.get(current._rawParentId) : null;
	  }

	  current = itemMap.get(targetId);
	  while (current) {
		if (ancestors.has(current.id)) return current.id;
		current = current._rawParentId ? itemMap.get(current._rawParentId) : null;
	  }
	  return rootId;
	}

	/**
	 * Очищает дерево от циклических зависимостей (BFS).
	 */
	// static removeCircularDependencies(
	//   rootItems: ElkNode[],
	//   itemMap: Map<string, ElkNode[]>
	// ): ElkNode[] {
	//   const validatedRootItems = [];
	//   const visited = new Set<string>();
	//   const queue: ElkNode[] = [];
	//
	//   for (let i = 0; i < rootItems.length; i++) {
	// 	queue.push(rootItems[i]);
	//   }
	//
	//   let head = 0;
	//   while (head < queue.length) {
	// 	const item = queue[head++];
	//
	// 	if (visited.has(item.id)) {
	// 	  console.warn(`[TreeBuilder] Loop detected! Item ID "${item.id}" skipped.`);
	// 	  continue;
	// 	}
	//
	// 	visited.add(item.id);
	//
	// 	const hasNoValidParent = !item.parentId ||
	// 							 item.id === item.parentId ||
	// 							 !itemMap.has(item.parentId) ||
	// 							 itemMap.get(item.parentId)!.id === undefined;
	//
	// 	if (hasNoValidParent) {
	// 	  validatedRootItems.push(item);
	// 	}
	//
	// 	if (item.children) {
	// 	  for (let i = 0; i < item.children.length; i++) {
	// 		queue.push(item.children[i]);
	// 	  }
	// 	}
	//   }
	//
	//   for (const item of itemMap.values()) {
	// 	if (item.children) {
	// 	  item.children = item.children.filter((child ) => visited.has(child.id));
	// 	}
	//   }
	//
	//   return validatedRootItems;
	// }

	public static buildElkGraph(nodes: Node[], edges: Edge[], rootOptions: any = {}): any {
	  const rootId = rootOptions.rootId || "root";
	  const layoutOptions = rootOptions.layoutOptions || { "elk.algorithm": "layered" };

	  // 1. Создаем один Master Map, где хранятся ВСЕ ноды в формате ELK
	  const itemMap: Map<string, ElkNode & { _rawParentId?: string }> = new Map(nodes.map(n => [n.id, { ...this.xy2elk(n), _rawParentId: n.parentId }]));
	  const base = new Map();

	  // 2. В один проход связываем ссылки. parentId и children работают автоматически на любую глубину
	  for (const [id, item] of itemMap.entries()) {
		const parentId = item._rawParentId;
		delete item._rawParentId; // убираем временное свойство, чтобы структура была чистой

		if (parentId && itemMap.has(parentId)) {
		  itemMap.get(parentId)!.children?.push(item); // children array created before in xy2elk
		} else {
		  base.set(id, item); // Корни и сироты без родителей
		}
	  }

		const graph: ElkNode = {
			id: rootId,
			layoutOptions,
			children: Array.from(base.values()),
			edges: [],
		};
		itemMap.set(rootId, graph);
		for (const edge of edges) {
			const sourceId = edge.source;
			const targetId = edge.target;

			// Если одна из нод была отфильтрована или отсутствует, пропускаем ребро
			if (!itemMap.has(sourceId) || !itemMap.has(targetId)) continue;

			const lcaId = this.findLca(sourceId, targetId, itemMap, rootId);
			const lcaNode = itemMap.get(lcaId)!;

			if (!lcaNode.edges) lcaNode.edges = [];
			lcaNode.edges.push({
				id: edge.id,
				sources: [sourceId],
				targets: [targetId]
			} as ElkExtendedEdge);
		}
		return itemMap.get(rootId)!;
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
