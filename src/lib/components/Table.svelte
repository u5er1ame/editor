<script lang="ts">
	import { mode } from 'mode-watcher';
	import { Grid, Toolbar, Willow, WillowDark, type IApi } from '@svar-ui/svelte-grid';
	import { Pager } from '@svar-ui/svelte-core';
	import { DatePicker, RichSelect, Combo } from "@svar-ui/svelte-core";
	import {  registerEditorItem } from "@svar-ui/svelte-editor";
	import { toast } from 'svelte-sonner';

	import { browser } from '$app/environment';
	import { DataTable } from '$lib/client/table.svelte';
	import { Table } from 'surrealdb';
	import Skeleton from './ui/skeleton/skeleton.svelte';


	registerEditorItem("richselect", RichSelect);
	registerEditorItem("combo", Combo);

	const Style = $derived.by(() => {
		if (mode.current && mode.current == 'dark') {
			return WillowDark;
		} else {
			return Willow;
		}
	});

	let tbl: IApi | undefined = $state();
	$effect(() => {
		if (tbl == undefined) return;
		tbl.on("update-cell", (ev) => {
			console.log("updated", ev);
		});
	});

	let { table, ...rest } = $props();

	// TODO: custom editor function
	const autoConfig = { editor: 'text', flexgrow: 1 };

	const table_state = new DataTable(new Table(table));
</script>

{#if browser}
	<div class="size-full max-w-svw">
		<Style>
			{#await table_state.fetchData() }
			<!-- {#await Promise.all([tableObj.fetchData(), tableObj.getColumns()])} -->
				<Skeleton class="size-full" />
			{:then}
				{#if table_state.data != null}
					<Toolbar api={tbl} />
					{#if table_state.usePagination}
						<Pager total={table_state.data.length} pageSize={table_state.pageSize} onchange={(e) => table_state.paginate(e)} />
					{/if}
					<Grid data={table_state.pagedData} columns={await table_state.getColumns()}  bind:this={tbl} />
				{/if}
			{:catch error}
				{toast.error(error)}
			{/await}
		</Style>
	</div>
{/if}

<style>
</style>
