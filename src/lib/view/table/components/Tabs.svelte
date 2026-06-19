<script lang="ts">
	import { tick } from 'svelte';
	import { watch } from 'runed';

	import { pushState } from '$app/navigation';

	import * as Tabs from '$lib/components/ui/tabs';
	import NewTable from '$lib/components/NewTable.svelte';

	import { getAllTables } from '$lib/db.remote';
	import { page } from '$app/state';

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

	let { tables, ...rest } = $props();

	let current_tab: string = $derived(page.state.table?.selected_tab?page.state.table?.selected_tab: tables.selected_tab);


	$effect(()=>{

	});
	watch(()=>current_tab, (cur,pre)=>{
		if (cur == pre) return;
		tick().then(()=>{ pushState(`?table=${cur}`, { table: { selected_tab: cur } })})
		// tick().then(()=>{ goto(`?table=${cur}`, { replaceState: true, state: { table: { selected_tab: cur } }})})
	});
</script>

{#snippet PrintIcon()}
	<span class="icon-[material-symbols--print-rounded] size-5 align-middle"></span>
{/snippet}

{#if tables.info}
	<div class="h-fit w-full p-1">
			<Tabs.Root bind:value={current_tab}>
				<Tabs.List class="size-full">
					{#each tables.info as table, i}
					{@const label = tables.config.find((c)=>c.id == table.name)?.label ?? table.name}
						<Tabs.Trigger
							value={table.name}
							title={label + (table.drop ? ' Writes disabled' : '')}
							class="w-full"
						>
							{@html isWriteable(table)}
							<!-- {controller.store.getTableMeta(table.name)?.title} -->
							{label}
							{@html getKind(table)}
						</Tabs.Trigger>
					{:else}
						<div class="size-full">
							<div class="text-center">
								<div class="text-xl">No tables found</div>
							</div>
						</div>
					{/each}
				</Tabs.List>
					{#each tables.info as table, i}
						{#if tables.selected_tab != undefined}
							<Tabs.Content value={tables.info[i].name} class="size-full">
								<!-- {#if getTable(table.name).error} -->
								<!-- 	<div class="size-full text-red-400"> -->
								<!-- 		{getTable(table.name).error} -->
								<!-- 	</div> -->
								<!-- {#if getTable(table.name).loading} -->
								<!-- 	<Skeleton class="size-full animate-pulse" /> -->
								<!-- {:else} -->
									<!-- {#if browser} -->
								{@const data = await getAllTables(table.name)}
								<NewTable data={data} table={table.name} readonly={table?.drop ?? false} config={{}} />
									<!-- {/if} -->
								<!-- {/if} -->
							</Tabs.Content>
						{/if}
					{/each}
			</Tabs.Root>
	</div>
{/if}

<style>
</style>
