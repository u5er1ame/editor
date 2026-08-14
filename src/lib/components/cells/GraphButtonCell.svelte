<script lang="ts">
	import type { IApi, IColumn, IRow } from '@svar-ui/svelte-grid';
	import { Button } from '$lib/components/ui/button';
	import { CircuitBoard } from '@lucide/svelte/icons';
	import { goto } from '$app/navigation';

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

	function handleClick() {
		const rowId = row.id;
		if (rowId) {
			onaction?.({
				action: 'show-in-graph',
				data: { rowId, tableName: column.id }
			});
			goto('/graph', {
				state: { graph: { selectedNodeId: String(rowId) } }
			});
		}
	}
</script>

<Button size="icon" onclick={handleClick} title="Show in graph">
	<CircuitBoard size={16} />
</Button>
