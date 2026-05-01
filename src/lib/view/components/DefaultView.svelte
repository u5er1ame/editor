<script lang="ts">
	import { mode } from 'mode-watcher';
	import { Grid, Willow, WillowDark } from '@svar-ui/svelte-grid';
	import { toast } from 'svelte-sonner';

	import { browser } from '$app/environment';
	import Skeleton from '$lib/components/ui/skeleton/skeleton.svelte';

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
		tbl.on("print", async (ev: any) => {
			console.log("printing", ev);
		});

		return () => {
			new_row_id = [];
			tbl = undefined;
		};
	});

	let { controller, ...rest } = $props();
    $inspect("comp",controller.tablesInfo)
	const autoConfig = { flexgrow: 1 };

	// const table_state = new DataTable(new Table(table));

</script>
{#snippet PrintIcon()}
	<span class="icon-[material-symbols--print-rounded] size-5 align-middle"></span>
{/snippet}

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
