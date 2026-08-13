<script lang="ts">
	import { tick } from 'svelte';
	import * as Select from '$lib/components/ui/select';
	import { getDataClient } from '$lib/db.remote';
	import Spinner from '$lib/components/ui/spinner/spinner.svelte';

	let {
		editor,
		onsave,
		oncancel,
		onapply,
		...rest
	}: {
		editor: {
			id: string | number;
			column: string | number;
			value?: any;
			renderedValue?: any;
			config?: { fetchTable?: string; labelKey?: string; valueKey?: string };
		};
		onsave?: (ignoreFocus?: boolean) => void;
		oncancel?: () => void;
		onapply?: (value: any) => void;
	} = $props();

	let open = $state(true);
	let saved = $state(false);

	// Extract config values
	const fetchTable = $derived(editor.config?.fetchTable);
	const labelKey = $derived(editor.config?.labelKey ?? 'name');
	const valueKey = $derived(editor.config?.valueKey ?? 'id');

	// Get current value - extract the id if it's an object
	const currentValue = $derived.by(() => {
		const val = editor.value;
		if (val && typeof val === 'object') {
			return val[valueKey];
		}
		return val;
	});

	let value = $state(currentValue);

	// Fetch data from the table
	const fetchData = $derived.by(() => {
		if (!fetchTable) return { loading: false, ready: false, current: [] };
		return getDataClient(fetchTable as any);
	});

	// Check if still loading
	const isLoading = $derived(fetchData.loading && !fetchData.ready);

	// Build options from fetched data
	const options = $derived.by(() => {
		if (!fetchData.ready || !fetchData.current) return [];
		return fetchData.current.map((item: any) => ({
			id: item[valueKey],
			label: item[labelKey]
		}));
	});

	// Find selected label for display
	const selectedLabel = $derived.by(() => {
		const option = options.find((opt) => opt.id === currentValue);
		return option?.label ?? '';
	});

	function handleChange(selectedValue: any) {
		const option = options.find((opt) => opt.id === selectedValue);
		if (option) {
			saved = true;
			// Return the full object with id and label
			onapply?.({ id: option.id, [labelKey]: option.label });
			onsave?.();
		}
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			saved = true;
			oncancel?.();
		}
	}

	function handleOpenChange(o: boolean) {
		if (!o && !saved) {
			// Only call cancel if we haven't saved yet
			tick().then(() => oncancel?.());
		}
	}
</script>

<div class="w-full" onkeydown={handleKeydown} role="button" tabindex="-1">
	<Select.Root
		type="single"
		{open}
		onOpenChange={handleOpenChange}
		bind:value
		onValueChange={handleChange}>
		<Select.Trigger
			class="h-full w-full border border-input bg-transparent p-0 focus-visible:ring-1 focus-visible:ring-ring">
			{selectedLabel || value || 'Select...'}
		</Select.Trigger>
		<Select.Content>
			{#if isLoading}
				<div class="flex items-center justify-center p-4">
					<Spinner size="24" />
				</div>
			{:else if options.length === 0}
				<div class="p-4 text-center text-muted-foreground">No options</div>
			{:else}
				{#each options as option (option.id)}
					<Select.Item
						value={option.id}
						label={option.label}
						class="data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground" />
				{/each}
			{/if}
		</Select.Content>
	</Select.Root>
</div>
