<script lang="ts">
	import type { IColumn, IRow } from '@svar-ui/svelte-grid';

	let { row, column, ...rest }: { row: IRow; column: IColumn } = $props();

	const value = $derived.by(() => {
		if (column.template) {
			return column.template(row[column.id as string], row, column);
		}
		return row[column.id as string] ?? '';
	});
</script>

<div class="size-full truncate p-1">
	{value}
</div>
