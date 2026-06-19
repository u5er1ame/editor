<script lang="ts">
	import { mode } from 'mode-watcher';
	import { Grid, Toolbar, Willow, WillowDark, type IApi, type IColumnConfig } from '@svar-ui/svelte-grid';
	import { registerToolbarItem } from '@svar-ui/svelte-toolbar';
	import { RichSelect, Combo } from '@svar-ui/svelte-core';
	import { registerEditorItem } from '@svar-ui/svelte-editor';

	import { browser } from '$app/environment';
	import Button from '$lib/components/svar/Button.svelte';
	import Header from './svar/Header.svelte';
	import { getTable } from '$lib/db.remote';

	registerEditorItem('richselect', RichSelect);
	registerEditorItem('combo', Combo);

	registerToolbarItem('print', Button);

	const Style = $derived.by(() => {
		if (mode.current && mode.current == 'dark') {
			return WillowDark;
		} else {
			return Willow;
		}
	});

	let tbl: IApi | undefined = $state();

	let new_row_id: string[] = $state([]);

	// INFO: first intercept add-row to generate id
	// second save new row id to state
	// third if update-cell is from new row use PUT request

	// $effect(() => {
	// 	if (tbl == undefined) return;
	// 	tbl.on("print", async (ev) => {
	// 		console.log("printing", ev);
	// 	});
	//
	// 	tbl.intercept(
	// 		'add-row',
	// 		async (ev) => {
	// 			if (isWriteable == false) return;
	// 			const res = await fetch('/api/v1/db/generate_id')
	// 				.then((r) => r.json())
	// 				.catch(() => toast.error('DB not available'));
	// 			const [generated] = res.data;
	// 			const id = new RecordId(table_state.table, generated).toString();
	// 			ev.id = id;
	// 			ev.row.id = id;
	// 			return ev;
	// 		},
	// 		{ intercept: true }
	// 	);
	//
	// 	tbl.on('add-row', async (ev) => {
	// 		if (isWriteable == false) return;
	// 		if (ev.id == undefined) return;
	// 		new_row_id.push(ev.id.toString());
	// 	});
	//
	// 	// tbl.on('update-cell', (ev) => {
	// 	// 	if (isWriteable == false) return;
	// 	// 	const row = tbl?.getRow(ev.id);
	// 	// 	if (row == null) return;
	// 	// 	const parsed = table_state?.schema!.safeParse(row);
	// 	// 	const out = parsed.data;
	// 	// 	if (!parsed.success) {
	// 	// 		toast.error(parsed.error.message);
	// 	// 		return;
	// 	// 	}
	// 	// 	if (new_row_id.includes(ev.id.toString())) {
	// 	// 		console.log('this is unsaved row!');
	// 	// 		fetch(`/api/v1/db/tables?q=${table_state.table}`, {
	// 	// 			method: 'PUT',
	// 	// 			body: JSON.stringify(jsonify(out))
	// 	// 		}).catch((e) => {
	// 	// 			console.error('error', e);
	// 	// 			toast.error(e.body.message);
	// 	// 		});
	// 	// 	} else {
	// 	// 		fetch(`/api/v1/db/tables?q=${table_state.table}`, {
	// 	// 			method: 'POST',
	// 	// 			body: JSON.stringify(jsonify(out))
	// 	// 		}).catch((e) => {
	// 	// 			console.error('error', e);
	// 	// 			toast.error(e.body.message);
	// 	// 		});
	// 	// 	}
	// 	// 	console.log('update-cell', out);
	// 	// 	new_row_id = [];
	// 	// });
	// 	return () => {
	// 		new_row_id = [];
	// 		tbl = undefined;
	// 	};
	// });

	let { data, table=$bindable(), readonly=$bindable(), config, ...rest } = $props();
$effect(() => {
	if (tbl == undefined) return;
	tbl.on("filter-rows", (ev) => {
		console.log("filter", ev);
	});
});
	const autoConfig: IColumnConfig = { editor: readonly?undefined:'text', flexgrow: 1, header: [{ cell: Header }, {filter: "richselect"}] };
	// const data = $derived(getTable(table));
</script>

{#snippet PrintIcon()}
	<span class="icon-[material-symbols--print-rounded] size-5 align-middle"></span>
{/snippet}

{#if browser}
	<div class="size-full max-w-svw p-2">
			<Style>
				{#if readonly == true}
					<div class="size-full text-start">
						<div class="text-xl text-red-400">Table is read-only! Writes disabled</div>
					</div>
				{/if}
				<!-- {#if data.length == 0} -->
				<!-- 			<div class="size-full text-start"> -->
				<!-- 				<div class="text-xl text-sky-400">Table is empty</div> -->
				<!-- 			</div> -->
				<!-- {:else} -->
					<Grid
						data={data}
						columns={[]}
						autoConfig={autoConfig}
						bind:this={tbl}
						filterValues={{ name: "test" }}
					/>
				<!-- {/if} -->
			</Style>
	</div>
{/if}

<style>
</style>
