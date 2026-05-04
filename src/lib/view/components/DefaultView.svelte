<script lang="ts">
	import { mode } from 'mode-watcher';
	import { Grid, Willow, WillowDark } from '@svar-ui/svelte-grid';
	import { toast } from 'svelte-sonner';

	import { browser } from '$app/environment';
	import Skeleton from '$lib/components/ui/skeleton/skeleton.svelte';
	import * as Tabs from '$lib/components/ui/tabs';
	import Table from '$lib/components/Table.svelte';

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

	let { controller, ...rest } = $props();

	const autoConfig = { flexgrow: 1 };

	// const table_state = new DataTable(new Table(table));
</script>

{#snippet PrintIcon()}
	<span class="icon-[material-symbols--print-rounded] size-5 align-middle"></span>
{/snippet}

{#if controller.tablesInfo}
	<div class="size-full p-1">
		{#if controller.tablesInfo.length > 0}
			<Tabs.Root value={controller.tablesInfo[0].name}>
				<Tabs.List class="size-full">
					{#each controller.tablesInfo as table, i}
						<Tabs.Trigger
							value={table.name}
							title={table.name + (table.drop ? ' Writes disabled' : '')}
						>
							{@html isWriteable(table)}{table.name}{@html getKind(table)}
						</Tabs.Trigger>
					{/each}
				</Tabs.List>
				{#each controller.tablesInfo as table}
					<Tabs.Content value={table.name}>
						<Table table={table.name} isWriteable={!table.drop} />
					</Tabs.Content>
				{/each}
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
{#if browser}
	<div class="size-full max-w-svw">
		<Style>
			<!-- {#await controller.fetchData()} -->
			<!-- 	<Skeleton class="size-full" /> -->
			<!-- {:then} -->
			<!-- 	{#if table_state.data != null} -->
			<!-- 		{#if isWriteable == false} -->
			<!-- 			<div class="size-full text-start"> -->
			<!-- 				<div class="text-xl text-red-400">Table is read-only! Writes disabled</div> -->
			<!-- 			</div> -->
			<!-- 		{/if} -->
			<!-- 		<Grid -->
			<!--                      {autoConfig} -->
			<!-- 			bind:this={tbl} -->
			<!-- 		/> -->
			<!-- 	{/if} -->
			<!-- {:catch error} -->
			<!-- 	{toast.error(error)} -->
			<!-- {/await} -->
		</Style>
	</div>
{/if}

<style>
</style>
