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
	import { getDataClient, generateId, updateRecord, insertRecord, deleteRecord } from '$lib/db.remote';
	import Skeleton from './ui/skeleton/skeleton.svelte';
	import Editor from './editor/Root.svelte';
	import type { DBContext } from '../../routes/+layout.svelte';
	import Theme from './svar/Theme.svelte';
	import Spinner from './ui/spinner/spinner.svelte';
	import { toast } from 'svelte-sonner';
	import { PlusIcon, RefreshCwIcon, Trash2Icon, PrinterIcon } from '@lucide/svelte';
	import { getContext, tick } from 'svelte';
	import { registerInlineEditors } from './inline-editors/register';
	import { replaceState } from '$app/navigation';
	import { page } from '$app/state';
	import { twMerge } from 'tailwind-merge';

	registerToolbarItem('print', Button);
	registerToolbarItem('icon', Button);
	registerInlineEditors();

	let tbl: IApi | undefined = $state();
	let new_row_ids = $state(new Set<string>());

	let { table = $bindable(), readonly = $bindable(), config, changes, ...rest } = $props();
	let selection: IRow | null = $state(null);
	const isEditor = $derived(
		(getContext<DBContext>('db').userRoles?.includes('EDITOR') ?? false) ||
			(getContext<DBContext>('db').userRoles?.includes('OWNER') ?? false)
	);
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
	const editorConfig = $derived.by(() => createEditorConfig(config.table));

	// Get columns that have header filters
	const columnsWithFilters = $derived.by(() => {
		if (!config?.table) return [];
		return config.table.filter((col: any) => col.props?.headerFilterConfig);
	});

	function parseError(error: string): string {
		try {
			return JSON.parse(error)?.message ?? error;
		} catch {
			return error;
		}
	}

	function validateRow(data: Record<string, any>, columns: IColumn[]): string[] {
		const errors: string[] = [];
		for (const col of columns) {
			if (col.hidden || col.id === 'id' || !col.header) continue;
			const key = col.id as string;
			const val = data[key];
			if (val === undefined || val === null || val === '') {
				const label = typeof col.header === 'string' ? col.header : String(col.id);
				errors.push(label);
			}
		}
		return errors;
	}

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

		// Restore selection from page state
		const savedRowId = page.state.selectedRow;
		if (savedRowId && savedRowId.startsWith(table + ':')) {
			tick().then(() => {
				api.exec('select-row', { id: savedRowId });
			});
		}

		// Prevent viewers from opening the inline editor.
		// Returning false from an interceptor cancels the event.
		api.intercept(
			'open-editor',
			async () => {
				if (!isEditor) {
					toast.message('You do not have permission to edit records', {
						duration: 2000,
						position: 'bottom-center'
					});
					return false;
				}
				return true;
			},
			{ intercept: true }
		);

		api.on('update-cell', async (ev) => {
			if (readonly || !isEditor) return;
			const rowId = String(ev.id);
			const row = api.getRow(ev.id);
			if (!row) return;

			const cellChanges: Record<string, any> = {};
			cellChanges[ev.column as string] = ev.value;

			if (new_row_ids.has(rowId)) {
				const inserted = await insertRecord({ table, data: { id: rowId, ...row, ...cellChanges } });
				if (inserted) {
					new_row_ids.delete(rowId);
					toast.success('Record created');
				} else {
					toast.error('Failed to create record');
				}
			} else {
				const res = await updateRecord({ table, id: rowId, changes: cellChanges });
				if (!res) {
					toast.error('Failed to save changes');
					getDataClient(table).refresh();
				}
			}
		});

		api.intercept(
			'add-row',
			async (ev) => {
				if (readonly || !isEditor) return false;
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
					{parseError(getDataClient(table).error)}
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
					<div class="print-hide mb-1 flex gap-1">
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
									new_row_ids.add(rowId);
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
								onclick: async () => {
									if (!selection || !isEditor) return;
									const rowId = String(selection.id);
									await deleteRecord({ table, id: rowId });
									tbl?.exec('delete-row', { id: selection.id });
									new_row_ids.delete(rowId);
									selection = null;
									getDataClient(table).refresh();
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
			onsave={async (e: any) => {
				if (!selection?.id || !isEditor) return;
				const rowId = String(selection.id);
				const data: Record<string, any> = { id: rowId };
				for (const [key, val] of Object.entries(e as Record<string, any>)) {
					if (key === 'id') continue;
					data[key] = val && typeof val === 'object' && val.id ? val.id : val;
				}

				const validationErrors = validateRow(data, config.table);
				if (validationErrors.length > 0) {
					toast.error(`Required fields: ${validationErrors.join(', ')}`);
					return;
				}

				if (new_row_ids.has(rowId)) {
					const inserted = await insertRecord({ table, data });
					if (inserted) {
						new_row_ids.delete(rowId);
						getDataClient(table).refresh();
						toast.success('Record created');
					} else {
						toast.error('Failed to create record');
						return;
					}
				} else {
					const res = await updateRecord({ table, id: rowId, changes: data });
					if (!res) {
						toast.error('Failed to save changes');
						return;
					}
					getDataClient(table).refresh();
				}
				showEditor = false;
				selection = null;
			}}
			onclose={(e: any) => {
				if (selection?.id) {
					tbl?.exec('close-editor', e);
				}
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
	@media print {
		.print-hide {
			display: none !important;
		}
	}
</style>
