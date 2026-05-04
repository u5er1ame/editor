<script lang="ts">
	import { mode } from 'mode-watcher';
	import { Grid, Willow, WillowDark } from '@svar-ui/svelte-grid';
	import { toast } from 'svelte-sonner';

	import { browser } from '$app/environment';
	import Skeleton from '$lib/components/ui/skeleton/skeleton.svelte';
	import * as Tabs from '$lib/components/ui/tabs';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import type { View } from '../table.svelte';
	import type { ViewController } from '$lib/controller/table.svelte';
	import { Table } from 'surrealdb';

	import { page } from '$app/state';
	import DefaultTable from './DefaultTable.svelte';

	function isWriteable(table: any) {
		if (table.drop) {
			return `<span class="icon-[material-symbols--lock] text-red-500"></span>`;
		} else {
			return ``;
		}
	}
	function getKind(table: any) {
		switch (table.kind.kind) {
			case 'RELATION':
				return `<span class="icon-[material-symbols--graph-8]"></span>`;
			case 'NORMAL':
				if (table.view) {
					return `<span class="icon-[material-symbols--table-eye-outline]"></span>`;
				}
			default:
				return '';
		}
	}
	const Style = $derived.by(() => {
		if (mode.current && mode.current == 'dark') {
			return WillowDark;
		} else {
			return Willow;
		}
	});

	let tbl: any | undefined = $state();

	let new_row_id: string[] = $state([]);
	let { controller, ...rest }: { controller: ViewController } = $props();

	const tables = $derived(controller.getTables());
	const { selected_tab } = page.data;
	let current_tab: string = $state('');
	const readonly = $derived.by(() => {
		return controller.tablesInfo?.findLast((table) => table.name == current_tab)?.drop ?? false;
	});
	$inspect(selected_tab);
	onMount(() => {
		if (tables && tables.length > 0) {
			current_tab = tables.includes(selected_tab) ? selected_tab : tables[0];
			goto(`?table=${current_tab}`);
		}
		return () => {};
	});
	// const table_state = new DataTable(new Table(table));
</script>

{#snippet PrintIcon()}
	<span class="icon-[material-symbols--print-rounded] size-5 align-middle"></span>
{/snippet}

{#if controller.tablesInfo}
	<div class="h-fit w-full p-1">
		{#if controller.tablesInfo.length > 0}
			<Tabs.Root value={current_tab}>
				<Tabs.List class="size-full">
					{#each controller.tablesInfo as table, i}
						<Tabs.Trigger
							onclick={() => {
								goto(`?table=${table.name}`, { replaceState: true });
								current_tab = table.name;
							}}
							value={table.name}
							title={table.name + (table.drop ? ' Writes disabled' : '')}
						>
							{@html isWriteable(table)}
							{controller.store.getTableMeta(table.name)?.title}
							{@html getKind(table)}
						</Tabs.Trigger>
					{/each}
				</Tabs.List>
				<Tabs.Content value={current_tab}>
					<DefaultTable {controller} table={current_tab} isWriteable={readonly} />
				</Tabs.Content>
			</Tabs.Root>
		{:else}
			<div class="size-full">
				<div class="text-center">
					<div class="text-xl">No tables found</div>
				</div>
			</div>
		{/if}
	</div>
{/if}

<style>
</style>
