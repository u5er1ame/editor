<script lang="ts">
	import type { IColumn, IRow } from '@svar-ui/svelte-grid';
	import Checkbox from '$lib/components/ui/checkbox/checkbox.svelte';

	let { row, column, ...rest }: { row: IRow; column: IColumn } = $props();

	const value = $derived.by(() => {
		return row[column.id as string] ?? false;
	});
</script>

<div class="flex size-full items-center p-1">
	<Checkbox checked={value} disabled />
</div>
