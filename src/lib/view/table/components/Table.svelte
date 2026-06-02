<script lang="ts">
	import { mode } from 'mode-watcher';
	import { Grid, Willow, WillowDark, type IColumnConfig } from '@svar-ui/svelte-grid';
	import { toast } from 'svelte-sonner';

	import { browser } from '$app/environment';
	import Skeleton from '$lib/components/ui/skeleton/skeleton.svelte';
	import { ColumnBuilder } from '$lib/builders/column.svelte';
	import { getContext } from 'svelte';
	import type { ViewController } from '$lib/controller/table.svelte';

	// registerEditorItem('richselect', RichSelect);
	// registerEditorItem('combo', Combo);

	// registerToolbarItem('print', Button);

	const Style = $derived.by(() => {
		if (mode.current && mode.current == 'dark') {
			return WillowDark;
		} else {
			return Willow;
		}
	});

	let tbl: any | undefined = $state();

	let new_row_id: string[] = $state([]);

	// INFO: first intercept add-row to generate id
	// second save new row id to state
	// third if update-cell is from new row use PUT request

	$effect(() => {
		if (tbl == undefined) return;
		return () => {
			new_row_id = [];
			tbl = undefined;
		};
	});

	let { table, isWriteable, ...rest } = $props();
	const controller: ViewController = getContext('viewsController');
	const schema = controller.store.getSchema(table)
	const builder = new ColumnBuilder(schema);
	$inspect("builder", builder.fieldsToFetch);
	const autoConfig = { flexgrow: 1 };
</script>

{#snippet PrintIcon()}
	<span class="icon-[material-symbols--print-rounded] size-5 align-middle"></span>
{/snippet}

{#if browser}
	<div class="size-full max-w-svw">
		<Style fonts={false}>
			{#if table != undefined}
				{#await controller.store.getData(table, builder.getFields())}
					<Skeleton class="size-full" />
				{:then data}
					{#if data.success}
						{#if isWriteable}
							<div class="text-xl text-red-400">Table is read-only! Writes disabled</div>
						{/if}
						{#if data.data.length == 0}
							<div class="text-xl">Table is empty</div>
						{:else}
								<Grid filterValues={{}} columns={builder.config} data={data.data} bind:this={tbl} />
						{/if}
					{/if}
				{:catch error}
					{toast.error(error.message)}
				{/await}
			{/if}
		</Style>
	</div>
{/if}

<style>
</style>
