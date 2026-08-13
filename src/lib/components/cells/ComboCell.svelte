<script lang="ts">
	import type { IColumn, IRow } from '@svar-ui/svelte-grid';
	import { getDataClient } from '$lib/db.remote';

	let {
		row,
		column,
		...rest
	}: {
		row: IRow;
		column: IColumn & {
			props?: { labelKey?: string; valueKey?: string; displayFormat?: string; fetchTable?: string };
		};
	} = $props();

	const labelKey = $derived(column.props?.labelKey ?? 'name');
	const valueKey = $derived(column.props?.valueKey ?? 'id');
	const fetchTable = $derived(column.props?.fetchTable);

	// Get the cell value
	const cellValue = $derived(row[column.id as string]);

	// Fetch full data for disambiguation
	const fetchData = $derived.by(() => {
		if (!fetchTable) return { ready: false, current: [] };
		return getDataClient(fetchTable as any);
	});

	// Find the full object with parent context
	const fullObject = $derived.by(() => {
		if (!fetchData.ready || !fetchData.current || !cellValue) return null;

		// Get the ID to lookup
		const id = typeof cellValue === 'object' ? cellValue[valueKey] : cellValue;
		if (!id) return null;

		// Find the full object
		return fetchData.current.find((item: any) => item[valueKey] === id) ?? null;
	});

	// Helper to resolve a dotted path like "level.name" on an object
	function resolvePath(obj: any, path: string): any {
		const parts = path.split('.');
		let val = obj;
		for (const part of parts) {
			val = val?.[part];
		}
		return val;
	}

	// Format the display value
	const value = $derived.by(() => {
		const data = fullObject ?? (typeof cellValue === 'object' ? cellValue : null);
		if (!data) return cellValue ?? '';

		const name = data[labelKey] ?? '';

		// Use custom format if provided
		const format = column.props?.displayFormat;
		if (format) {
			// Format like "{level.name} / {name}" - split by "/" and resolve each part
			const parts = format.split('/');
			const values: string[] = [];
			for (const part of parts) {
				const key = part.replace(/[{}]/g, '').trim();
				values.push(resolvePath(data, key) ?? '');
			}
			return values.filter(Boolean).join(' / ');
		}

		// Default: show direct parent if exists
		const parentKeys = Object.keys(data).filter(
			(k) => typeof data[k] === 'object' && data[k] !== null && data[k].name
		);
		if (parentKeys.length > 0) {
			const parentName = data[parentKeys[0]].name;
			return `${parentName} / ${name}`;
		}

		return name;
	});
</script>

<div class="size-full truncate p-1">
	{value}
</div>
