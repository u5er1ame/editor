<script lang="ts">
	import { mode } from 'mode-watcher';
	import { Grid, Toolbar, Willow, WillowDark, type IApi } from '@svar-ui/svelte-grid';
	import { Pager } from '@svar-ui/svelte-core';
	import { RichSelect, Combo } from '@svar-ui/svelte-core';
	import { registerEditorItem } from '@svar-ui/svelte-editor';
	import { toast } from 'svelte-sonner';

	import { browser } from '$app/environment';
	import { DataTable } from '$lib/client/table.svelte';
	import { jsonify, RecordId, StringRecordId, Table } from 'surrealdb';
	import Skeleton from './ui/skeleton/skeleton.svelte';

	registerEditorItem('richselect', RichSelect);
	registerEditorItem('combo', Combo);

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

	$effect(() => {
		if (tbl == undefined) return;
		tbl.intercept(
			'add-row',
			async (ev) => {
				if (isWriteable == false) return;
				const res = await fetch('/api/v1/db/generate_id')
					.then((r) => r.json())
					.catch(() => toast.error('DB not available'));
				const [generated] = res.data;
				const id = new RecordId(table_state.table, generated).toString();
				ev.id = id;
				ev.row.id = id;
				return ev;
			},
			{ intercept: true }
		);

		tbl.on('add-row', async (ev) => {
			if (isWriteable == false) return;
			if (ev.id == undefined) return;
			new_row_id.push(ev.id.toString());
		});

		tbl.on('update-cell', (ev) => {
			if (isWriteable == false) return;
			const row = tbl?.getRow(ev.id);
			if (row == null) return;
			const parsed = table_state?.schema!.safeParse(row);
			const out = parsed.data;
			if (!parsed.success) {
				toast.error(parsed.error.message);
				return;
			}
			if (new_row_id.includes(ev.id.toString())) {
				console.log('this is unsaved row!');
				fetch(`/api/v1/db/tables?q=${table_state.table}`, {
					method: 'PUT',
					body: JSON.stringify(jsonify(out))
				}).catch((e) => {
					console.error('error', e);
					toast.error(e.body.message);
				});
			} else {
				fetch(`/api/v1/db/tables?q=${table_state.table}`, {
					method: 'POST',
					body: JSON.stringify(jsonify(out))
				}).catch((e) => {
					console.error('error', e);
					toast.error(e.body.message);
				});
			}
			console.log('update-cell', out);
			new_row_id = [];
		});
		return () => {
			new_row_id = [];
			tbl = undefined;
		};
	});

	let { table, isWriteable, ...rest } = $props();

	const autoConfig = { editor: 'text', flexgrow: 1 };

	const table_state = new DataTable(new Table(table));
</script>

{#if browser}
	<div class="size-full max-w-svw">
		<Style>
			{#await table_state.fetchData()}
				<!-- {#await Promise.all([tableObj.fetchData(), tableObj.getColumns()])} -->
				<Skeleton class="size-full" />
			{:then}
				{#if table_state.data != null}
					{#if isWriteable == true}
						<Toolbar api={tbl} />
					{:else}
						<div class="size-full text-start">
							<div class="text-xl text-red-400">Table is read-only! Writes disabled</div>
						</div>
					{/if}
					{#if table_state.usePagination}
						<Pager
							total={table_state.data.length}
							pageSize={table_state.pageSize}
							onchange={(e) => table_state.paginate(e)}
						/>
					{/if}
					<Grid
						data={table_state.pagedData}
						columns={await table_state.getColumns()}
						init={(api)=> table_state.getSort(api)}
						bind:this={tbl}
					/>
				{/if}
			{:catch error}
				{toast.error(error)}
			{/await}
		</Style>
	</div>
{/if}

<style>
</style>
