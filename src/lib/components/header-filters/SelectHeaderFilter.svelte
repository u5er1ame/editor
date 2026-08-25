<script lang="ts">
	import * as Select from '$lib/components/ui/select';
	import { getDataClient } from '$lib/db.remote';
	import Spinner from '$lib/components/ui/spinner/spinner.svelte';
	import XIcon from '@lucide/svelte/icons/x';

	let {
		api,
		column,
		onaction,
		cell,
		...rest
	}: {
		api?: any;
		column?: any;
		onaction?: (ev: { action: string; data?: any }) => void;
		cell?: any;
	} = $props();

	let open = $state(false);
	let value = $state<string | undefined>(undefined);

	// Print mode detection: SVAR passes `cell` and no `onaction` when printing
	const isPrint = $derived(!onaction && cell);

	// Label text for print mode
	const labelText = $derived.by(() => {
		if (!isPrint || !cell) return '';
		if (typeof cell === 'object' && 'text' in cell && cell.text) return cell.text;
		const headers = column?.header;
		if (Array.isArray(headers)) {
			const text = headers.find((h: any) => h && h.text)?.text;
			if (text) return text;
		}
		return column?.id ?? '';
	});

	// Extract config from header cell
	const config = $derived.by(() => {
		if (!column?.header) return null;
		const headerCells = Array.isArray(column.header) ? column.header : [column.header];
		for (const cell of headerCells) {
			if (cell?.config?.fetchTable) {
				return cell.config;
			}
		}
		return null;
	});

	const fetchTable = $derived(config?.fetchTable);
	const labelKey = $derived(config?.labelKey ?? 'name');
	const valueKey = $derived(config?.valueKey ?? 'id');
	const filterPath = $derived(config?.filterPath);
	const displayFormat = $derived(config?.displayFormat);
	const showRawLabel = $derived(config?.showRawLabel);

	// Only fetch data when NOT in print mode to avoid errors
	const fetchData = $derived.by(() => {
		if (isPrint) return { loading: false, ready: false, current: [] };
		if (!fetchTable) return { loading: false, ready: false, current: [] };
		return getDataClient(fetchTable as any);
	});

	// Check if still loading
	const isLoading = $derived(fetchData.loading && !fetchData.ready);

	// Helper to resolve a dotted path like "level.name" on an object
	function resolvePath(obj: any, path: string): any {
		const parts = path.split('.');
		let val = obj;
		for (const part of parts) {
			val = val?.[part];
		}
		return val;
	}

	// Build options from fetched data with disambiguation
	const options = $derived.by(() => {
		if (!fetchData.ready || !fetchData.current) return [];
		return fetchData.current.map((item: any) => {
			const name = item[labelKey] ?? '';

			// Apply display format for disambiguation
			let label = name;
			if (displayFormat) {
				const parts = displayFormat.split('/');
				const values: string[] = [];
				for (const part of parts) {
					const key = part.replace(/[{}]/g, '').trim();
					values.push(resolvePath(item, key) ?? '');
				}
				label = values.filter(Boolean).join(' / ');
			} else if (!showRawLabel) {
				// Default: show parent if exists
				const parentKeys = Object.keys(item).filter(
					(k) => typeof item[k] === 'object' && item[k] !== null && item[k].name
				);
				if (parentKeys.length > 0) {
					label = `${item[parentKeys[0]].name} / ${name}`;
				}
			}

			return {
				id: item[valueKey],
				label
			};
		});
	});

	function applyFilter(selectedValue: string | undefined) {
		value = selectedValue;
		const columnId = column?.id;

		if (api && columnId) {
			if (value) {
				api.exec('filter-rows', {
					filter: (row: any) => {
						const cellValue = row[columnId];
						if (!cellValue) return false;

						// If filterPath is specified, use it to get the value to compare
						if (filterPath) {
							const filterValue = resolvePath(cellValue, filterPath);
							return filterValue === value;
						}

						// If cellValue is an object, use valueKey
						if (typeof cellValue === 'object') {
							return cellValue[valueKey] === value;
						}

						// Direct value comparison
						return cellValue === value;
					}
				});
			} else {
				api.exec('filter-rows', { filter: null });
			}
		}

		onaction?.({
			action: 'header-filter-change',
			data: { columnId: column?.id, value }
		});
	}

	function handleChange(selectedValue: any) {
		applyFilter(selectedValue || undefined);
	}

	function handleClear(e: MouseEvent) {
		e.stopPropagation();
		e.preventDefault();
		applyFilter(undefined);
	}
</script>

<div class="header-filter relative w-full">
	{#if isPrint}
		<!-- Print mode: just show the label text, no interactive elements -->
		<span class="truncate text-xs">{labelText}</span>
	{:else}
		<!-- Normal mode: interactive select filter -->
		<Select.Root type="single" bind:open bind:value onValueChange={handleChange}>
			<Select.Trigger class="h-8 w-full pr-7 text-xs">
				<span class="truncate">
					{value ? (options.find((o) => o.id === value)?.label ?? 'Filter') : 'All'}
				</span>
			</Select.Trigger>
			<Select.Content>
				{#if isLoading}
					<div class="flex items-center justify-center p-4">
						<Spinner size="16" />
					</div>
				{:else}
					<Select.Item value="" label="All" />
					{#each options as option (option.id)}
						<Select.Item value={option.id} label={option.label} />
					{/each}
				{/if}
			</Select.Content>
		</Select.Root>
		{#if value}
			<button
				type="button"
				class="absolute top-1/2 right-1 z-10 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded hover:bg-muted"
				onclick={handleClear}
				title="Clear filter">
				<XIcon class="h-3 w-3" />
			</button>
		{/if}
	{/if}
</div>
