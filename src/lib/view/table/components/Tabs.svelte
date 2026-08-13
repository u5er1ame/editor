<script lang="ts">
	import { getContext, tick } from 'svelte';
	import { watch } from 'runed';

	import { page } from '$app/state';
	import { invalidate, invalidateAll, pushState, replaceState } from '$app/navigation';

	import * as Tabs from '$lib/components/ui/tabs';
	import NewTable from '$lib/components/NewTable.svelte';

	import { getDatabaseInfo } from '$lib/db.remote';
	import type { DBContext } from '../../../../routes/+layout.svelte';

	function isWriteable(table: any) {
		if (table?.drop) {
			return `<span class="iconify material-symbols--lock text-destructive"></span>`;
		} else {
			return ``;
		}
	}
	function getKind(table: any) {
		switch (table?.kind.kind) {
			case 'RELATION':
				return `<span class="iconify material-symbols--graph-8"></span>`;
			case 'NORMAL':
				if (table.view) {
					return `<span class="iconify material-symbols--table-eye-outline"></span>`;
				}
			default:
				return '';
		}
	}

	let { tables, ...rest } = $props();
	let current_tab: string = $derived(
		page.state.table?.selected_tab ? page.state.table?.selected_tab : tables.selected_tab
	);
	class TableState {
		name: string = $state('');
		label: string = $derived(tables.config.find((c) => c.id == this.name)?.label ?? this.name);
		kind: string = $derived(getKind(tables.info.tables.find((t) => t.name == this.name)));
		isWriteable: string = $derived(
			isWriteable(tables?.info?.tables.find((t) => t.name == this.name))
		);
		isSelected: boolean = $derived(current_tab == this.name);
		selectedRow?: string = $state(undefined);
		changes = $state({
			updated: [],
			deleted: [],
			added: []
		});
		hasChanges: boolean = $derived(
			this.changes.added.length > 0 ||
				this.changes.deleted.length > 0 ||
				this.changes.updated.length > 0
		);
		constructor(name: string) {
			this.name = name;
		}
	}

	const db = getContext<DBContext>('db');
	const info = $derived(tables.info);
	const tableChanges = info.tables.map((table) => {
		return new TableState(table.name);
	});
	$effect(() => {});
	watch(
		() => current_tab,
		(cur, pre) => {
			if (cur == pre) return;
			if (!cur) return;
			tick().then(() => {
				// pushState(`?table=${cur}`, { table: { selected_tab: cur } });
				replaceState(``, { table: { selected_tab: cur } });
			});
			// tick().then(()=>{ goto(`?table=${cur}`, { replaceState: true, state: { table: { selected_tab: cur } }})})
		}
	);

	watch(
		() => db.database,
		(cur, pre) => {
			if (cur == pre) return;
			getDatabaseInfo().refresh();
		}
	);
</script>

{#snippet PrintIcon()}
	<span class="iconify size-5 align-middle material-symbols--print-rounded"></span>
{/snippet}

{#key db.database}
	{#if info}
		<div class="size-auto p-1">
			<Tabs.Root bind:value={current_tab} class="items-center justify-center">
				<Tabs.List class="size-full bg-header">
					{#each info.tables as table, i}
						{@const changes = tableChanges.find((t) => t.name == table.name)}
						<Tabs.Trigger
							value={table.name}
							title={changes?.label + (table.drop ? ' Writes disabled' : '')}
							class="w-full data-[state=active]:bg-accent/50 data-[state=active]:text-primary-foreground dark:data-[state=active]:bg-accent/50">
							{@html changes?.isWriteable ?? ''}
							<!-- {controller.store.getTableMeta(table.name)?.title} -->
							{changes?.label}
							{@html changes?.kind ?? ''}
							{#if changes?.hasChanges}
								<span
									title="Have unsaved changes"
									class="iconify size-4 text-hover solar--danger-circle-bold-duotone">
								</span>
							{/if}
						</Tabs.Trigger>
					{:else}
						<div class="size-full">
							<div class="text-center">
								<div class="text-xl">No tables found</div>
							</div>
						</div>
					{/each}
				</Tabs.List>
				{#each info.tables as table, i}
					{#if tables.selected_tab != undefined}
						<Tabs.Content value={table.name} class="size-full ">
							{#key current_tab}
								{#if table.name == current_tab}
									{@const config = tables?.config.find((c) => c.id == table.name)}
									{@const changes = tableChanges.find((t) => t.name == table.name)}
									<NewTable table={table.name} readonly={table?.drop ?? false} {config} {changes} />
								{/if}
							{/key}
						</Tabs.Content>
					{/if}
				{/each}
			</Tabs.Root>
		</div>
	{/if}
{/key}

<style>
</style>
