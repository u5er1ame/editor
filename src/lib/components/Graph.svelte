<script lang="ts">
	import type { ELK, ElkNode } from 'elkjs/lib/elk-api';

	import { watch } from 'runed';
	import {
		useSvelteFlow,
		useNodesInitialized,
		useOnSelectionChange,
		getIncomers,
		SvelteFlow,
		Panel,
		Controls,
		Background,
		BackgroundVariant,
		type OnConnectEnd,
		type SvelteFlowProps,
		type Node,
		type Edge,
		type IsValidConnection,
		type OnBeforeConnect,
		useNodes
	} from '@xyflow/svelte';
	import { toast } from 'svelte-sonner';
	import Button from '$lib/components/Button.svelte';

	// INFO: custom node types use global css class for styling
	// each node wrapper has class "svelte-flow__node-{type}"
	// where "type" is key from this table
	// make sure keys in utls match styles in respective node component

	import Toolbar from './Toolbar.svelte';
	import { tick, untrack } from 'svelte';
	import Breadcrumb from './Breadcrumb.svelte';
	import { GraphViewController } from '$lib/view/graph.svelte';
	import type { ServerData } from '$lib/model/schemas';
	import { flowReady } from '../../routes/graph/+page.svelte';
	import { resizer } from '$lib/utils';

	let {
		elk,
		nodes = $bindable([]),
		nodeTypes = {},
		edgeTypes = {},
		edges = $bindable([]),
		colorMode = $bindable('system')
	}: SvelteFlowProps & { elk: ELK | null } = $props();

	let dbNodes: Node[] = $state.raw(nodes);
	let dbEdges: Edge[] = $state.raw(edges || []);

	const { fitView, getZoom, getNode, updateNode, getNodes, getEdges, updateEdge } = useSvelteFlow();

	const zoom = $derived.by(getZoom);
	const isHidden = $derived(zoom < 1);

	watch(
		() => isHidden,
		(current) => {
			allEdges
				.filter((e) => e.type == 'inbound')
				.forEach((e) => {
					e.hidden = current;
					$effect.pre(() => updateEdge(e.id, { hidden: current }));
				});
			if (useNodesInitialized().current) {
				allNodes
					.filter((n) => n.type == 'breakers' || n.type == 'unsaved_breakers')
					.forEach((n) => {
						n.hidden = current;
						$effect.pre(() => updateNode(n.id, { hidden: current }));
					});
			}
		}
	);

	const allNodes: Node<{ raw: ServerData; labelKey: string; prio: number }>[] =
		$derived.by(getNodes);
	const allEdges = $derived.by(getEdges);

	async function onLayout() {
		try {
			// const withLayout = await layout(dbNodes, edges, options);
			// dbNodes = withLayout.nodes
			// edges = withLayout.edges
			await oninitlayout();
			$flowReady = true;
			await fitView();
		} catch (e: any) {
			toast.error(e.message);
		}
	}

	let once = $state(true);
	$effect.pre(() => {
		if (useNodesInitialized().current && once) {
			onLayout();
			once = false;
		}
	});

	// let selectedNodesIds = $state<string[]>([]);
	// let selectedNodes = $state<Node[]>([]);

	useOnSelectionChange(({ nodes }) => {
		// selectedNodesIds = nodes.map((n) => n.id);
		// selectedNodes = nodes;
	});

	let selectionReady = $state(true);
	async function oninit() {
		allNodes.forEach((n) => console.log(n.measured));
		dbNodes.forEach((n) => $resizer.set(n.id, false));
	}
	const onbeforeconnect: OnBeforeConnect = (c) => {
		console.log('onbeforeconnect', c);
		if (getNode(c.source)?.parentId == getNode(c.target)?.parentId) {
			return { ...c, type: 'inbound', animated: true };
		} else {
			return { ...c, type: 'outbound', animated: true };
		}
	};

	const onconnectend: OnConnectEnd = (e, c) => {
		// BUG: little edgecase because i add target node too
		if (c.toNode == null) {
			intersection.clear();
		}
		reactiveIntersection = intersection.values().toArray();
		intersection.clear();
	};

	function buildList(node: Node, include_themselves = false) {
		let out = new Set<Node>(include_themselves ? [node] : []);
		function getConnected(n: Node) {
			const incomers = getIncomers(n, getNodes(), getEdges());
			if (incomers.length == 0) return out;
			for (const child of incomers) {
				out.add(child);
				getConnected(child);
				// out = out.union(getConnected(child));
			}
			// const result = await Promise.all(incomers.map(async (child)=>{
			//     return out.union(await getConnected(child));
			// }));
			return out;
		}
		const res = getConnected(node);
		return res;
	}

	let intersection: Set<Node> = new Set();
	let reactiveIntersection: Node[] = $state([]);
	// FIXME: idk why it works as intended. rewrite for single timer
	$effect(() => {
		tick().then(() => {
			reactiveIntersection.forEach((n) => {
				updateNode(n.id, { class: 'outline outline-rose-600 animate-pulse' });
			});
			if (reactiveIntersection.length > 0) {
				toast.warning('Cycle detected! Connection skipped');
			}
		});
		reactiveIntersection.forEach((n) => {
			setTimeout(() => {
				updateNode(n.id, { class: 'outline-none' });
			}, 2000);
		});
	});

	const isValidConnection: IsValidConnection = (e) => {
		if (e.source == e.target) {
			return false;
		}
		// INFO: i reversed it just because its logically easier to think about
		const end = getNode(e.source);
		const start = getNode(e.target);
		if (!end || !start) return false;

		// INFO: this is very simple implementation of common ancestors
		// not all cases covered
		// always connect from root and it will be fine
		const list = buildList(start, false);
		const list_source = buildList(end, true);
		intersection = list.intersection(list_source);
		if (list.size > 0 && list_source.size > 0) {
			if (intersection.size > 0) {
				return false;
			}
		}
		return true;
	};

	function onflowerror(e: any) {
		console.error(e);
		toast.error('Flow error: ' + e);
	}
	const ready = $derived(useNodesInitialized().current);
	let layouted: ElkNode | null = $state(null);
	watch(
		() => layouted,
		(cur, pre) => {
			if (cur == null) return;
			const updated = GraphViewController.elk2xy(cur);
			useNodes().update((nodes) => {
				return nodes.map((node) => {
					if (updated.has(node.id)) {
						return { ...node, ...updated.get(node.id)! };
					} else {
						return node;
					}
				});
			});
		}
	);

	async function oninitlayout() {
		if (ready) {
			console.log('nodes initialized...layouting');
			const root = {
				id: 'root',
				layoutOptions: {
					'elk.algorithm': 'layered',
					'elk.direction': 'DOWN',
					'elk.hierarchyHandling': 'INCLUDE_CHILDREN',
					'elk.separateConnectedComponents': 'true',
					// 'elk.componentPacking.strategy': 'RECTPACKING',
					'elk.contentAlignment': 'V_CENTER H_CENTER',
					'elk.layered.compaction.postCompaction.strategy': 'EDGE_LENGTH',
					'elk.layered.nodePlacement.bk.fixedAlignment': 'BALANCED',
					'elk.aspectRatio': '0.8',
					'elk.spacing.nodeNode': '32'
				}
			};
			const elkGraph: ElkNode = untrack(() => {
				return GraphViewController.buildElkGraph(allNodes, allEdges, root);
			});
			console.log('elkGraph', elkGraph);
			if (elk) {
				layouted = await elk.layout(elkGraph);
			}
		}
	}

	$effect(() => {
		// if (ready) {
		// 	console.log('nodes initialized...layouting');
		// 	const root = {
		// 		id: 'root',
		// 		layoutOptions: {
		// 			'elk.algorithm': 'layered',
		// 			'elk.direction': 'DOWN',
		// 			'elk.hierarchyHandling': 'INCLUDE_CHILDREN',
		// 			'elk.timeout': '1000',
		// 			'elk.edgeRouting': 'POLYLINE',
		// 			'elk.spacing.nodeNode': '20'
		// 		}
		// 	};
		// 	const elkGraph: ElkNode = untrack(() => {
		// 		return GraphViewController.buildElkGraph(allNodes, allEdges, root);
		// 	});
		// 	console.log('elkGraph', elkGraph);
		// 	if (elk) {
		// 		elk.layout(elkGraph).then((layouted) => {
		// 			layouted = layouted;
		// 		});
		// 	}
		// }
		return () => {
			$flowReady = false;
		};
	});
</script>

<SvelteFlow
	class="size-full"
	proOptions={{ hideAttribution: true }}
	{oninit}
	{onflowerror}
	{onbeforeconnect}
	{onconnectend}
	{isValidConnection}
	onselectionend={() => {
		selectionReady = true;
	}}
	onselectionstart={() => {
		selectionReady = false;
	}}
	selectionOnDrag
	panOnDrag={[1]}
	nodes={dbNodes}
	{nodeTypes}
	edges={dbEdges}
	{edgeTypes}
	{colorMode}
	minZoom={0.1}
	maxZoom={99}
	snapGrid={[16, 16]}
	nodeDragThreshold={20}
>
	<Toolbar ready={selectionReady} />
	<Controls class="bg-transparent " position="top-right" />
	<Panel
		class="flex h-fit w-auto flex-row items-center justify-center gap-2 p-1"
		position="bottom-center"
	>
		<Button class="svelte-flow__controls-button" onclick={() => onLayout()}>
			{#snippet children()}
				<span
					class="iconify material-symbols--responsive-layout-outline-rounded size-6 text-amber-600"
				></span>
				<div class="size-auto">layout</div>
			{/snippet}
		</Button>
	</Panel>
	<Panel
		class="flex h-fit w-auto flex-row items-center justify-center gap-2 bg-transparent p-1"
		position="bottom-right"
	>
		<Button
			title="Update db"
			--color="var(--color-secondary)"
			class="hover:text-red cursor-pointer bg-header hover:bg-hover"
			onclick={() => console.log(dbNodes)}
		>
			{#snippet children()}
				<span class="iconify material-symbols--database-upload-outline-rounded size-6"></span>
			{/snippet}
		</Button>
	</Panel>
	<Panel
		class="flex h-fit w-auto flex-row items-center justify-center gap-2 bg-transparent p-1"
		position="top-center"
	>
		<Breadcrumb />
	</Panel>
	<Panel position="bottom-left"></Panel>
	<Background
		bgColor="var(--color-background)"
		patternColor="var(--color-secondary)"
		size={1}
		gap={36}
		lineWidth={0.2}
		variant={BackgroundVariant.Lines}
	/>
</SvelteFlow>
