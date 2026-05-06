<script lang="ts">
	import { onMount } from 'svelte';

	import { page } from '$app/state';
	import { goto } from '$app/navigation';

	import * as Tabs from '$lib/components/ui/tabs';
	import type { ViewController } from '$lib/controller/table.svelte';

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

	let { controller, ...rest }: { controller: ViewController } = $props();

	const tables = $derived(controller.getTables());
	const { selected_tab } = page.data;
	let current_tab: string = $state(selected_tab);
	const readonly = $derived.by(() => {
		return controller.tablesInfo?.findLast((table) => table.name == current_tab)?.drop ?? false;
	});

	onMount(() => {
		if (tables && tables.length > 0) {
			current_tab = tables.includes(selected_tab) ? selected_tab : tables[0];
			goto(`?table=${current_tab}`, { replaceState: true });
		}
		return () => {};
	});
</script>

{#snippet PrintIcon()}
	<span class="icon-[material-symbols--print-rounded] size-5 align-middle"></span>
{/snippet}

{#if controller.tablesInfo}
	<div class="h-fit w-full p-1">
		{#if controller.tablesInfo.length > 0}
			<Tabs.Root bind:value={current_tab}>
				<Tabs.List class="size-full">
					{#each controller.tablesInfo as table, i}
						<Tabs.Trigger
							onclick={() => {
								current_tab = table.name;
								console.log("clck");
								goto(`?table=${table.name}`, { replaceState: true });
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
				{#if current_tab != undefined}
					<Tabs.Content value={current_tab}>
						{#key current_tab}
							<DefaultTable {controller} table={current_tab} isWriteable={readonly} />
						{/key}
					</Tabs.Content>
				{/if}
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
