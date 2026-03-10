<script lang="ts">
	import { onMount, tick } from 'svelte';
	import { mode } from 'mode-watcher';
	import { browser } from '$app/environment';
	import { Grid, Toolbar, Willow, WillowDark, type IApi } from '@svar-ui/svelte-grid';
	import { Pager } from '@svar-ui/svelte-core';
	import Skeleton from './ui/skeleton/skeleton.svelte';

	const Style = $derived.by(() => {
		if (mode.current && mode.current == 'dark') {
			return WillowDark;
		} else {
			return Willow;
		}
	});

	let tbl: IApi | undefined = $state();
	let { table, ...rest } = $props();

	// TODO: custom editor function
	const autoConfig = { editor: 'text', flexgrow: 1 };

	let pageSize = 15;
	let pagedData: any[] = $state([]);

	// const values = fetch(`/api/v1/db/tables?q=${table}`).then((r) => r.json());
	// let data = $state([]);

	function paginate(e: any) {
		const { from, to } = e;
		if (data == null) {
			pagedData = [];
		} else {
			pagedData = data.data.slice(from, to);
		}
	}

	const url = `/api/v1/db/tables?q=${table}`;
	let data: { data: any[] } | null = $state(null);
	onMount(async () => {
		data = await fetch(url)
			.then((r) => r.json())
			.then((r) => r);
		if (data) pagedData = data.data.slice(0, pageSize);
	});
	$inspect(data);
</script>

{#if browser}
	<div class="size-full max-w-svw">
		<Style>
			<!-- {#await data} -->
			<!-- 	<Skeleton /> -->
			<!-- {:then res} -->
			{#if data != null}
				<Toolbar api={tbl} />
				<Pager api={tbl} total={data.data.length} {pageSize} onchange={(e) => paginate(e)} />
				<Grid data={pagedData} {autoConfig} bind:this={tbl} />
			{/if}
			<!-- {/await} -->
		</Style>
	</div>
{/if}

<style>
</style>
