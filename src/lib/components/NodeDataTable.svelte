<script lang="ts">
	import { type SvelteComponent, untrack } from 'svelte';
	import { toast } from 'svelte-sonner';
	import { mode } from 'mode-watcher';
	import { Grid, Toolbar, Willow, WillowDark, type IApi } from '@svar-ui/svelte-grid';
	import { type Node, useNodesData, useNodes, useOnSelectionChange } from '@xyflow/svelte';
	import { browser } from '$app/environment';

	const Style = $derived.by(() => {
		if (mode.current && mode.current == 'dark') {
			return WillowDark;
		} else {
			return Willow;
		}
	});

	let { } = $props();
	let tbl: IApi | undefined = $state();
	function init(api: IApi) {
		api.on("update-cell", (event) => {
			console.log("update-cell", event);
		});
	}
	const nodes = $derived(useNodes().current);
	let selected: Node | undefined = $state();

	useOnSelectionChange(({ nodes, edges }) => {
		if (nodes.length == 1) {
			selected = nodes[0];
		} else {
			selected = undefined;
		}
	});

	const childs = $derived.by(() => {
		if (!selected) {
			return [];
		}
		return useNodes().current.filter((n) => n.parentId == selected!.id);
	});
	const tableType = $derived.by(() => {
		if (!selected) {
			return undefined;
		}
		return selected.type;
	});

	const columns = $derived.by(() => {
		if (!selected) {
			return [];
		}
		return Flow.tableLayout[selected.type!];
	});

	const data = $derived.by(() => {
		if (!selected) {
			return [];
		}
		const ids = untrack(() => childs.map((n) => n.id));
		if (ids.length == 0) {
			return [];
		}
		const data = useNodesData(ids).current;
		const types = untrack(() => data[0].type);
		if (data.every((n) => n.type == types)) {
			return data.map((n) => n.data);
		} else {
			toast.error('Inconsistent data to show in a table!');
			return [];
		}
	});
</script>

{#if browser}
	<Style class="size-full">
		<Grid {data} {columns} bind:this={tbl} {init} />
		{#if selected}
			<Toolbar api={tbl} />
		{/if}
	</Style>
{/if}
