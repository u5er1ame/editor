<script lang="ts">
	import { mode } from 'mode-watcher';
	import { getEditorConfig, Grid, Willow, WillowDark, type IApi, type IColumn, type IHeaderCell, type IRow, type TColumnHeader } from '@svar-ui/svelte-grid';
	import { registerToolbarItem } from '@svar-ui/svelte-toolbar';

	import { browser } from '$app/environment';
	import Button from '$lib/components/svar/Button.svelte';
	import { getTable } from '$lib/db.remote';
	import Skeleton from './ui/skeleton/skeleton.svelte';
	import Editor from './Editor.svelte';
	import type { Component, SvelteComponent } from 'svelte';


	registerToolbarItem('print', Button);

	const Style = $derived.by(() => {
		if (mode.current && mode.current == 'dark') {
			return WillowDark;
		} else {
			return Willow;
		}
	});

	let tbl: Component<IApi> | undefined = $state();

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

	let { table=$bindable(), readonly=$bindable(), config, ...rest } = $props();

	let id = $state();
	let selection: IRow | null = $state(null);
	let showEditor = $state(false);
	function createEditorConfig(columns: [IColumn & { fetchTable?: string }]) {
		type Config = {
			id?: string | number;
			editor?: string;
			label?: string;
			fetchTable?: string;
		};
		const out: Config[]  = columns.map((col)=>{
			const out: Partial<Config> = {};
			out.id = col.id;
			out.editor = col.editor as string ?? "none";
			out.fetchTable = col.fetchTable;
			if (!col.header && !col.hidden) {
				out.label = col.id as string;
			}
			if (typeof col.header == "string") {
				out.label = col.header;
			}
			if (Array.isArray(col.header)) {
				out.label = col.header?.reduce((acc: string,itm: IHeaderCell)=>{
					if (itm.text) {
						return acc.concat(itm.text);
					}
					return acc;
				}, "");
			}
			return out;
		}).filter((itm)=>itm)
		return out;
	}
	const editorConfig = createEditorConfig(config.table);
		console.log("editorconf", editorConfig);
	$effect(() => {
		// if (tbl == undefined || id == undefined) return;
		// const data = tbl.getRow(id);
		// console.log("row", id ,data);
	});
	const init = (api: IApi) => {
		api.on("select-row", (ev) => {
			if (selection) {
				selection = ev.id? api.getRow(ev.id):null;
			}
			// id = ev.id;
			// const data = api.getRow(ev.id);
			// console.log("selected", ev.id, data);
			// return ev.id
		});

		api.intercept("open-editor", (ev) => {
			selection = api.getRow(ev.id);
			showEditor = true;
			return false;
		});
		api.on("close-editor", (ev) => {
			console.log("close-editor", ev);
		});
	};
	$effect(() => {
		// if (tbl == undefined) return;
		// tbl.on("select-row", (ev) => {
		// 	id = ev.id;
		// 	const data = tbl.getRow(ev.id);
		// 	console.log("select", ev.id, data);
		// 	return ev.id
		// });
		// tbl.on("open-editor", (ev) => {
		// 	console.log("edit", ev);
		// });
	});
</script>

{#snippet PrintIcon()}
	<span class="icon-[material-symbols--print-rounded] size-5 align-middle"></span>
{/snippet}

{#if browser}
	<div class="size-full max-w-svw p-2">
			{#await getTable(table)}
				<Skeleton class="w-full h-full animate-pulse m-1"/>
			{:catch e}
				<div class="size-full text-start">
					<div class="text-xl text-rose-400">{e.error.message}</div>
				</div>
			{:then raw}
			{@const data = raw.map((itm)=>{
				itm.id = itm.id.toString();
				return itm;
			})}
			{#if data && data.length == 0}
				<div class="size-full text-start">
					<div class="text-xl text-sky-400">Table is empty</div>
				</div>
			{:else}
				<Style>
					{#if readonly == true}
						<div class="size-full text-start">
							<div class="text-xl text-red-400">Table is read-only! Writes disabled</div>
						</div>
					{/if}
						<Grid
							{init}
							bind:this={tbl}
							data={data}
							columns={config.table}
							filterValues={[]}
						/>
				</Style>
			{/if}
		{/await}
	</div>
	<Editor bind:show={showEditor} onsave={()=>{}} onclose={(e)=>{ tbl.exec("close-editor",e)}} values={selection} config={config.table} />
{/if}

<style>
	:global(.wx-theme) {
		--wx-background: var(--background) !important;
		--wx-background-alt: var(--secondary) !important;
		--wx-background-hover: var(--chart-1) !important;

		--wx-border: 0.5px solid var(--border) !important;
		--wx-border-radius: var(--radius) !important;

		--wx-table-header-background: var(--muted) !important;
		--wx-table-select-background: --alpha(var(--color-emerald-900)/10%) !important;
		--wx-table-select-color: var(--foreground) !important;
		--wx-table-select-border: inset 3px 0 var(--color-emerald-500) !important;

		--wx-button-background: var(--secondary) !important;
		--wx-button-font-color: var(--primary-foreground) !important;

		--wx-color-font: var(--foreground) !important;
		--wx-color-font-alt: var(--primary-foreground) !important;
		--wx-color-font-disabled: var(--muted-foreground) !important;
		--wx-color-primary: var(--primary) !important;
		--wx-color-primary-font: var(--primary-foreground) !important;
		--wx-color-secondary: var(--secondary) !important;
		--wx-color-secondary-font: var(--secondary-foreground) !important;
		--wx-color-disabled: var(--muted) !important;
		--wx-color-font-disabled: var(--muted-foreground) !important;
		--wx-color-link: var(--accent-foreground) !important;

		--wx-input-placeholder-color: var(--secondary) !important;
	}
	:global(.wx-grid .wx-table-box) {
		border-radius: var(--radius) !important;
	}
	:global(.wx-cell:focus ) {
		outline-color: var(--color-emerald-700) !important;
	}
</style>
