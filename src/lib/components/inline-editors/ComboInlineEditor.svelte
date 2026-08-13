<script lang="ts">
	import CheckIcon from '@lucide/svelte/icons/check';
	import ChevronsUpDownIcon from '@lucide/svelte/icons/chevrons-up-down';
	import { tick } from 'svelte';
	import * as Command from '$lib/components/ui/command/index.js';
	import * as Popover from '$lib/components/ui/popover/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { cn } from '$lib/utils.js';
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
	let triggerRef = $state<HTMLButtonElement>(null!);
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

	function closeAndFocusTrigger() {
		open = false;
		tick().then(() => {
			triggerRef?.focus();
		});
	}

	function handleSelect(optionId: string | number) {
		const option = options.find((opt) => opt.id === optionId);
		if (option) {
			saved = true;
			// Return the full object with id and label
			onapply?.({ id: option.id, [labelKey]: option.label });
			closeAndFocusTrigger();
			tick().then(() => onsave?.());
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
	<Popover.Root bind:open onOpenChange={handleOpenChange}>
		<Popover.Trigger
			bind:ref={triggerRef}
			class="w-full justify-between font-normal ring ring-secondary">
			{#snippet child({ props })}
				<Button variant="primary" class="w-full" {...props} role="combobox" aria-expanded={open}>
					{selectedLabel || currentValue || 'Select...'}
					<ChevronsUpDownIcon class="ms-2 size-4 shrink-0 opacity-50" />
				</Button>
			{/snippet}
		</Popover.Trigger>
		<Popover.Content class="w-fit p-0">
			{#if isLoading}
				<div class="flex items-center justify-center p-4">
					<Spinner size="24" />
				</div>
			{:else}
				<Command.Root>
					<Command.Input placeholder="Search..." />
					<Command.List>
						<Command.Empty>No values!</Command.Empty>
						<Command.Group>
							{#each options as option (option.id)}
								<Command.Item
									value={String(option.id)}
									onSelect={() => handleSelect(option.id)}
									class="data-[selected=true]:bg-accent data-[selected=true]:text-accent-foreground">
									<CheckIcon
										class={cn('me-2 size-4', currentValue !== option.id && 'text-transparent')} />
									{option.label}
								</Command.Item>
							{/each}
						</Command.Group>
					</Command.List>
				</Command.Root>
			{/if}
		</Popover.Content>
	</Popover.Root>
</div>
