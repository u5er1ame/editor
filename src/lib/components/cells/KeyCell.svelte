<script lang="ts">
	import type { IColumn, IRow } from '@svar-ui/svelte-grid';

	let {
		row,
		column,
		...rest
	}: { row: IRow; column: IColumn & { props?: { key?: string; displayFormat?: string } } } =
		$props();

	const key = $derived(column.props?.key ?? 'name');
	const value = $derived.by(() => {
		const cellValue = row[column.id as string];
		if (!cellValue) return '';

		if (typeof cellValue === 'object') {
			const name = cellValue[key] ?? '';

			// Use custom format if provided
			const format = column.props?.displayFormat;
			if (format) {
				// Simple template: {parent.key} / {key}
				return format.replace(/\{([^}]+)\}/g, (_, path) => {
					const parts = path.split('.');
					let val: any = cellValue;
					for (const part of parts) {
						val = val?.[part];
					}
					return val ?? '';
				});
			}

			// Default: show direct parent if exists
			const parentKeys = Object.keys(cellValue).filter(
				(k) => typeof cellValue[k] === 'object' && cellValue[k] !== null && cellValue[k].name
			);
			if (parentKeys.length > 0) {
				const parentName = cellValue[parentKeys[0]].name;
				return `${parentName} / ${name}`;
			}

			return name;
		}
		return cellValue;
	});
</script>

<div class="size-full truncate p-1">
	{value}
</div>
