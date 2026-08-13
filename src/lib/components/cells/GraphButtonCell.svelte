<script lang="ts">
	import type { IApi, IColumn, IRow } from '@svar-ui/svelte-grid';
	import { Button } from '$lib/components/ui/button';
	import { CircuitBoard } from '@lucide/svelte/icons';
	import { getContext } from 'svelte';

	let {
		row,
		column,
		api,
		onaction,
		...rest
	}: {
		row: IRow;
		column: IColumn;
		api: IApi;
		onaction?: (ev: { action: string; data?: any }) => void;
	} = $props();
	let d = $state();
	$effect(() => {
		d = api.getState();
	});
	function handleClick() {
		const rowId = row.id;
		const tableName = column.id;

		// Emit action to show in graph
		onaction?.({
			action: 'show-in-graph',
			data: { rowId, tableName }
		});

		// Also try to navigate via URL
		if (rowId) {
			const url = new URL(window.location.href);
			url.searchParams.set('table', tableName as string);
			url.searchParams.set('row', rowId as string);
			url.searchParams.set('view', 'graph');
			window.history.pushState({}, '', url.toString());
			window.dispatchEvent(new PopStateEvent('popstate'));
		}
	}
</script>

<Button size="icon" onclick={handleClick} title="Show in graph">
	<CircuitBoard size={16} />
</Button>
