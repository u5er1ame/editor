<script module>
	import { SvelteMap } from 'svelte/reactivity';
	import { writable } from 'svelte/store';

	export const resizer = writable(new SvelteMap<string, boolean>());
	export const client_nodes = writable<Node[]>([]);
	export const client_edges = writable<Edge[]>([]);
</script>

<script lang="ts">
	import type { ELK } from 'elkjs/lib/elk-api';

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
		type OnBeforeConnect} from '@xyflow/svelte';
	import { toast } from 'svelte-sonner';
	import Button from '$lib/components/Button.svelte';

	// INFO: custom node types use global css class for styling
	// each node wrapper has class "svelte-flow__node-{type}"
	// where "type" is key from this table
	// make sure keys in utls match styles in respective node component

	import { Flow } from '$lib/utils';
	import Toolbar from './Toolbar.svelte';
	import { tick, untrack } from 'svelte';
	import ScrollArea from './ui/scroll-area/scroll-area.svelte';
	import { flatToNested } from '$lib/client/utls';
	import Breadcrumb from './Breadcrumb.svelte';

	let {
		nodes = $bindable([]),
		edges = $bindable([]),
		colorMode = $bindable('system')
	}: SvelteFlowProps & { elk: ELK | null } = $props();

	let dbNodes: Node[] = $state.raw(nodes);
	let dbEdges: Edge[] = $state.raw(edges || []);

	const { fitView, getZoom, getNode, updateNode, getNodes, getEdges, updateEdge } = useSvelteFlow();

	const zoom = $derived.by(getZoom);
	const isHidden = $derived(zoom < 1);

	watch(()=>isHidden, (current) => {
		allEdges.filter((e) => e.type == 'inbound').forEach((e) => {
			e.hidden = current;
			$effect.pre(() => updateEdge(e.id, { hidden: current }));
		});
		if (useNodesInitialized().current) {
				allNodes.filter((n) => n.type == 'breakers' || n.type == 'unsaved_breakers')
					.forEach((n) => {
						n.hidden = current;
						$effect.pre(() => updateNode(n.id, { hidden: current }));
					});
		}
	});

	const allNodes = $derived.by(getNodes);
	const allEdges = $derived.by(getEdges);

	async function onLayout() {
		try {
			// const withLayout = await layout(dbNodes, edges, options);
			// dbNodes = withLayout.nodes
			// edges = withLayout.edges

			fitView();
		} catch (e: any) {
			toast.error(e.message);
		}
	}

	let once = true;
	$effect.pre(() => {
		if (useNodesInitialized().current && once) {
			// onLayout();
			once = false;
		}
	});

	let selectedNodesIds = $state<string[]>([]);
	let selectedNodes = $state<Node[]>([]);
	let panelView = $derived.by(()=>{
		if (selectedNodes.length == 0) {
			const roots = untrack(()=>allNodes.filter(n=>!n.parentId));
			return roots
		}
		return selectedNodes;
	});

	useOnSelectionChange(({ nodes }) => {
		selectedNodesIds = nodes.map((n) => n.id);
		selectedNodes = nodes;
	});

	let selectionReady = $state(true);
	async function oninit() {
		dbNodes.forEach((n) => $resizer.set(n.id, false));
		// onLayout();
	}
	const onbeforeconnect: OnBeforeConnect = (c) => {
		if (getNode(c.source)?.parentId == getNode(c.target)?.parentId) {
			return { ...c, type: 'inbound', animated: true };
		} else {
			return { ...c, type: 'outbound', animated: true };
		}
	};

	const onconnectend: OnConnectEnd = (e, c) => {
		// BUG: little edgecase because i add target node too
		if(c.toNode == null) {
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
	$effect(()=>{
		tick().then(()=>{
			reactiveIntersection.forEach((n)=>{
				updateNode(n.id, { class: "outline outline-rose-600 animate-pulse" });
			});
			if (reactiveIntersection.length > 0) {
				toast.warning("Cycle detected! Connection skipped");
			}
		});
		reactiveIntersection.forEach((n)=>{
			setTimeout(()=>{
				updateNode(n.id, { class: "outline-none" });
			},2000);
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
		const list = buildList(start, true);
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
	edges={dbEdges}
	{colorMode}
	nodeTypes={Flow.nodeTypes}
	edgeTypes={Flow.edgeTypes}
	minZoom={0.1}
	maxZoom={99}
	snapGrid={[5, 5]}
	nodeDragThreshold={20}
>
	<Toolbar ready={selectionReady} />
	<Controls position="top-right" />
	<Panel
		class="flex h-fit w-auto flex-row items-center justify-center gap-2 bg-transparent p-1"
		position="bottom-center"
	>
		<Button onclick={() => onLayout()}>
			{#snippet children()}
				<span
					class="icon-[material-symbols--responsive-layout-outline-rounded] size-6 text-amber-600"
				></span>
				<div class="size-auto">layout?</div>
			{/snippet}
		</Button>
	</Panel>
	<Panel
		class="flex h-fit w-auto flex-row items-center justify-center gap-2 bg-transparent p-1"
		position="bottom-right"
	>
		<Button
			title="Update db"
			--color="var(--color-rose-400)"
			class="hover:bg-rose-200 hover:text-rose-500"
			onclick={() => console.log(dbNodes)}
		>
			{#snippet children()}
				<span class="icon-[material-symbols--database-upload-outline-rounded] size-6"></span>
			{/snippet}
		</Button>
	</Panel>
	<Panel
		class="flex h-fit w-auto flex-row items-center justify-center gap-2 bg-transparent p-1"
		position="top-center"
	>
		<Breadcrumb />
	</Panel>
	<Panel
		class="flex h-fit w-auto flex-row items-center justify-center gap-2 bg-transparent p-1"
		position="top-left"
	>
		<ScrollArea class="w-fit max-w-xl h-fit max-h-1/3 bg-rose-200">
			{#each panelView as node}
				<div class="w-fit h-fit bg-rose-200">
					{node.data.name}
				</div>
			{/each}
		</ScrollArea>
	</Panel>
	<Background size={1} variant={BackgroundVariant.Dots} />
</SvelteFlow>
