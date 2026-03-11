<script lang="ts">
	import { onMount, tick } from 'svelte';
	import { mode } from 'mode-watcher';
	import { browser } from '$app/environment';
	import { Grid, Toolbar, Willow, WillowDark, type IApi } from '@svar-ui/svelte-grid';
	import { Pager } from '@svar-ui/svelte-core';
	import { DataTable } from '$lib/client/table.svelte';
	import { Table } from 'surrealdb';
	import Skeleton from './ui/skeleton/skeleton.svelte';
	import { DatePicker, RichSelect, Combo } from "@svar-ui/svelte-core";
	import {  registerEditorItem } from "@svar-ui/svelte-editor";

	import Button from "$lib/components/Button.svelte";
	registerEditorItem("richselect", RichSelect);
	registerEditorItem("combo", Combo);
	registerEditorItem("test", Button);

	const Style = $derived.by(() => {
		if (mode.current && mode.current == 'dark') {
			return WillowDark;
		} else {
			return Willow;
		}
	});

	let tbl: IApi | undefined = $state();

	let { table, ...rest } = $props();

	const tableObj = new DataTable(new Table(table));
	// TODO: custom editor function
	const autoConfig = { editor: 'text', flexgrow: 1 };
</script>

{#if browser}
	<div class="size-full max-w-svw">
		<Style>
			{#await tableObj.fetchData() }
			<!-- {#await Promise.all([tableObj.fetchData(), tableObj.getColumns()])} -->
				<Skeleton />
			{:then}
				{#if tableObj.data != null}
					<Toolbar api={tbl} />
					<Pager total={tableObj.data.length} pageSize={tableObj.pageSize} onchange={(e) => tableObj.paginate(e)} />
					<Grid data={tableObj.pagedData} columns={tableObj.getColumns()} {autoConfig} bind:this={tbl} />
				{/if}
			{/await}
		</Style>
	</div>
{/if}

<style>
</style>
