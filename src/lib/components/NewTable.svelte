<script lang="ts">
	import {
		Grid,
		Toolbar,
		type IApi,
		type IColumn,
		type IHeaderCell,
		type IRow
	} from '@svar-ui/svelte-grid';
	import { registerToolbarItem } from '@svar-ui/svelte-toolbar';

	import { browser } from '$app/environment';
	import Button from '$lib/components/svar/Button.svelte';
	import { getDataClient, generateId } from '$lib/db.remote';
	import Skeleton from './ui/skeleton/skeleton.svelte';
	import Editor from './editor/Root.svelte';
	import type { DBContext } from '../../routes/+layout.svelte';
	import Theme from './svar/Theme.svelte';
	import Spinner from './ui/spinner/spinner.svelte';
	import { toast } from 'svelte-sonner';
	import { PlusIcon, RefreshCwIcon, Trash2Icon, TrashIcon } from '@lucide/svelte';
	import { getContext } from 'svelte';

	registerToolbarItem('print', Button);
	registerToolbarItem('icon', Button);

	let tbl: IApi | undefined = $state();

	let new_row_id: string[] = $state([]);

	// INFO: first intercept add-row to generate id
	// second save new row id to state
	// third if update-cell is from new row use PUT request

	let { table = $bindable(), readonly = $bindable(), config, changes, ...rest } = $props();
	let id = $state();
	let selection: IRow | null = $state(null);
	const isEditor = $derived(getContext<DBContext>('db').userRoles?.includes('EDITOR') ?? false);
	let column: string | null = $state(null);
	let ref: HTMLElement | null = $state(null);
	let showEditor = $state(false);
	function createEditorConfig(columns: [IColumn & { props?: any }]) {
		interface Config {
			id?: string | number;
			editor?: string;
			label?: string;
			props?: {
				fetchTable?: string;
				labelKey?: string;
				valueKey?: string;
			};
		}
		const out: Config[] = columns
			.map((col) => {
				const out: Partial<Config> = {};
				out.id = col.id;
				out.editor = (col.editor as string) ?? 'none';
				out.props = col.props;
				if (!col.header && !col.hidden) {
					out.label = col.id as string;
				}
				if (typeof col.header == 'string') {
					out.label = col.header;
				}
				if (Array.isArray(col.header)) {
					out.label = col.header?.reduce((acc: string, itm: IHeaderCell | string) => {
						if (typeof itm == 'string') return acc.concat(itm);
						if (itm.text) {
							return acc.concat(itm.text);
						}
						return acc;
					}, '');
				}
				return out;
			})
			.filter((itm) => itm);
		return out;
	}
	const editorConfig = createEditorConfig(config.table);
	$effect(() => {
		// if (tbl == undefined || id == undefined) return;
		// const data = tbl.getRow(id);
		// console.log("row", id ,data);
	});
	const init = (api: IApi) => {
		tbl = api;
		api.on('select-row', (ev) => {
			changes.selectedRow = ev.id;
			if (selection) {
				selection = ev.id ? api.getRow(ev.id) : null;
			}
			// id = ev.id;
			// const data = api.getRow(ev.id);
			// console.log("selected", ev.id, data);
			// return ev.id
		});

		api.intercept('open-editor', (ev) => {
			if (isEditor) {
				selection = api.getRow(ev.id);
				column = ev.column as string;
				showEditor = true;
			} else
				toast.message('You are not editor dude', { duration: 2000, position: 'bottom-center' });
			return false;
		});
		api.on('close-editor', (ev) => {
			console.log('close-editor', ev);
		});
		api.intercept(
			'add-row',
			async (ev) => {
				if (readonly == false) return;
				// ID is already set by the button handler
				if (!ev.id) return;
				return ev;
			},
			{ intercept: true }
		);
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
	<span class="iconify size-5 align-middle material-symbols--print-rounded"></span>
{/snippet}
{#snippet Plus()}
	<PlusIcon />
{/snippet}
{#snippet Trash()}
	<Trash2Icon />
{/snippet}
{#snippet Refresh()}
	<RefreshCwIcon />
{/snippet}

{#if browser}
	<!-- <div class="wx-theme size-full max-w-svw"> -->
	<Theme>
		{#if getDataClient(table).loading}
			<div class="flex size-full flex-row justify-center">
				Loading...
				<Spinner size="200" />
			</div>
		{:else if getDataClient(table).error}
			<div class="flex size-full flex-row justify-center">
				<div class="text-xl text-destructive">{JSON.parse(getDataClient(table).error)?.message ?? getDataClient(table).error.toString() }</div>
			</div>
		{:else if getDataClient(table).ready}
			{@const data = getDataClient(table).current}
			{#if data && data.length == 0}
				<div class="size-full text-start">
					<div class="text-xl text-secondary">Table is empty</div>
				</div>
			{:else}
				<!-- <Style> -->
				{#if readonly == true}
					<div class="size-full text-start">
						<div class="text-xl text-destructive">Table is read-only! Writes disabled</div>
					</div>
				{/if}
				{#if isEditor}
					<Toolbar
						api={tbl}
						items={[
							{
								id: 'add-row',
								comp: 'icon',
								text: 'Add Row',
								onclick: async () => {
									const res = (await generateId(table)) as { id: string } | undefined;
									if (!res || !res.id) return;
									const rowId = res.id;
									await tbl?.exec('add-row', { id: rowId, row: { id: rowId } });
									selection = tbl?.getRow(rowId) ?? { id: rowId };
									console.log(rowId, selection);
									showEditor = true;
								},
								variant: 'primary',
								snippet: Plus
							},
							{
								id: 'delete-row',
								comp: 'icon',
								text: 'Delete Row',
								onclick: () => {
									if (selection) {
										tbl?.exec('delete-row', { id: selection.id });
									}
								},
								variant: 'destructive',
								snippet: Trash
							},
							{
								id: 'refresh',
								comp: 'icon',
								text: 'Refresh',
								onclick: async () => {
									getDataClient(table).refresh();
								},
								variant: 'secondary',
								snippet: Refresh
							}
						]} />
				{/if}
				<Grid {init} {data} columns={config.table} filterValues={[]} />
				<!-- </Style> -->
			{/if}
		{/if}
	</Theme>
	<!-- </div> -->
	{#if isEditor}
		<Editor
			bind:show={showEditor}
			onsave={(e) => {
				console.log(e);
			}}
			onclose={(e: any) => {
				tbl?.exec('close-editor', e);
			}}
			bind:values={selection}
			config={editorConfig} />
	{/if}
{/if}

<style>
	:global(.wx-theme) {
		/*PLACE HERE*/

		--wx-table-select-background: --alpha(var(--wx-color-primary-selected)/20%);
		--wx-table-select-color: var(--wx-color-font);
		--wx-table-border: var(--wx-border);
		--wx-table-select-border: inset 3px 0 var(--color-active);
		--wx-table-header-border: var(--wx-table-border);
		--wx-table-header-background: var(--color-header);
		--wx-table-header-cell-border: var(--wx-table-border);
		--wx-table-footer-cell-border: var(--wx-table-border);
		--wx-table-cell-border: var(--wx-table-border);
		--wx-header-font-weight: 600;
		--wx-table-fixed-column-border: 3px solid var(--wx-background-alt);
		--wx-table-editor-dropdown-border: var(--wx-border);
		--wx-table-editor-dropdown-shadow: 0px 4px 16px 0px var(--color-black);
		--wx-table-drag-over-background: var(--wx-background-alt);
		--wx-table-drag-zone-shadow:
			0px 1px 2px var(--wx-background-hover), 0px 3px 10px var(--wx-background-hover);
	}
	:global(.wx-table-box) {
		border-radius: var(--wx-border-radius);
	}
</style>
