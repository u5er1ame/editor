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
	import { PlusIcon, RefreshCwIcon, Trash2Icon, TrashIcon, PrinterIcon } from '@lucide/svelte';
	import { getContext } from 'svelte';
	import { registerInlineEditors } from './inline-editors/register';
	import { replaceState } from '$app/navigation';
	import { page } from '$app/state';
	import { twMerge } from 'tailwind-merge';

	registerToolbarItem('print', Button);
	registerToolbarItem('icon', Button);
	registerInlineEditors();

	let tbl: IApi | undefined = $state();

	let { table = $bindable(), readonly = $bindable(), config, changes, ...rest } = $props();
	let selection: IRow | null = $state(null);
	const isEditor = $derived(getContext<DBContext>('db').userRoles?.includes('EDITOR') ?? false);
	let showEditor = $state(false);

	// Page state persistence for view transitions using SvelteKit
	$effect(() => {
		if (selection?.id) {
			let prev: App.PageState = page.state;
			prev.selectedRow = selection.id;
			prev.selectedTable = table;
			replaceState('', prev);
		}
	});

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

	// Get columns that have header filters
	const columnsWithFilters = $derived.by(() => {
		if (!config?.table) return [];
		return config.table.filter((col: any) => col.props?.headerFilterConfig);
	});

	const init = (api: IApi) => {
		tbl = api;
		api.on('select-row', (ev) => {
			changes.selectedRow = ev.id;
			if (!selection) selection = ev.id ? api.getRow(ev.id) : null;
			else {
				if (selection.id != ev.id) {
					selection = ev.id ? api.getRow(ev.id) : null;
				}
			}
		});

		api.intercept(
			'add-row',
			async (ev) => {
				if (readonly == false) return;
				if (!ev.id) return;
				return ev;
			},
			{ intercept: true }
		);
	};

	let refresh = $state(true);
	function customCellsStyle(row: any, col: IColumn) {
		let out: string = ''; // this is added to cell class
		if (col.id && typeof col.id == 'string' && col.id.includes('actions')) {
			out = twMerge(out, 'bg-header!');
			if (selection && selection.id == row.id) {
				out = twMerge(out, 'bg-[var(--wx-table-select-background)]!');
			}
		}
		return out;
	}
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
{#snippet Print()}
	<PrinterIcon />
{/snippet}

{#if browser}
	<Theme>
		{#if getDataClient(table).loading}
			<div class="flex size-full flex-row justify-center">
				Loading...
				<Spinner size="200" />
			</div>
		{:else if getDataClient(table).error}
			<div class="flex size-full flex-row justify-center">
				<div class="text-xl text-destructive">
					{JSON.parse(getDataClient(table).error)?.message ?? getDataClient(table).error.toString()}
				</div>
			</div>
		{:else if getDataClient(table).ready}
			{@const data = getDataClient(table).current}
			{#if data && data.length == 0}
				<div class="size-full text-start">
					<div class="text-xl text-secondary">Table is empty</div>
				</div>
			{:else}
				{#if readonly == true}
					<div class="size-full text-start">
						<div class="text-xl text-destructive">Table is read-only! Writes disabled</div>
					</div>
				{/if}
				<!-- Header filters row -->
				{#if columnsWithFilters.length > 0}
					<div class="mb-1 flex gap-1">
						{#each columnsWithFilters as col (col.id)}
							<div class="min-w-0 flex-1">
								{#if col.props.headerFilterComponent}
									{@render col.props.headerFilterComponent({ api: tbl, column: col })}
								{/if}
							</div>
						{/each}
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
									refresh = !refresh;
								},
								variant: 'secondary',
								snippet: Refresh
							},
							{
								id: 'print',
								comp: 'icon',
								text: 'Print',
								onclick: async () => {
									if (!tbl) return;
									// Theme.svelte has @media print styles
									tbl.exec('print', { mode: 'portrait', paper: 'a4' });
								},
								variant: 'secondary',
								snippet: Print
							}
						]} />
				{/if}
				{#key refresh}
					<Grid
						{init}
						{data}
						columns={config.table}
						autoRowHeight
						cellStyle={customCellsStyle}
						filterValues={[]} />
				{/key}
			{/if}
		{/if}
	</Theme>
	{#if isEditor}
		<Editor
			bind:show={showEditor}
			onsave={(e: any) => {
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
	/*:global(.wx-body) {
		--wx-padding: 0.2em;
	}
	:global(.wx-cell:data-[role='gridcell']) {
		padding: var(--wx-padding);
	}*/
</style>
