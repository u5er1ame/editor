<script lang="ts">
	import { mode } from 'mode-watcher';
	import {
		Grid,
		Willow,
		WillowDark,
		type IApi,
		type IColumn,
		type IHeaderCell,
		type IRow
	} from '@svar-ui/svelte-grid';
	import { registerToolbarItem } from '@svar-ui/svelte-toolbar';

	import { browser } from '$app/environment';
	import Button from '$lib/components/svar/Button.svelte';
	import { getDataClient } from '$lib/db.remote';
	import Skeleton from './ui/skeleton/skeleton.svelte';
	import Editor from './editor/Root.svelte';
	import type { Component } from 'svelte';

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

	let { table = $bindable(), readonly = $bindable(), config, ...rest } = $props();

	let id = $state();
	let selection: IRow | null = $state(null);
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
					out.label = col.header?.reduce((acc: string, itm: IHeaderCell) => {
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
		api.on('select-row', (ev) => {
			if (selection) {
				selection = ev.id ? api.getRow(ev.id) : null;
			}
			// id = ev.id;
			// const data = api.getRow(ev.id);
			// console.log("selected", ev.id, data);
			// return ev.id
		});

		api.intercept('open-editor', (ev) => {
			selection = api.getRow(ev.id);
			column = ev.column as string;
			showEditor = true;
			return false;
		});
		api.on('close-editor', (ev) => {
			console.log('close-editor');
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
	<div class="wx-theme size-full max-w-svw">
		{#await getDataClient(table)}
			<Skeleton class="m-1 h-full w-svw animate-pulse bg-header" />
		{:then data}
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
				<Grid {init} bind:this={tbl} {data} columns={config.table} filterValues={[]} />
				<!-- </Style> -->
			{/if}
		{:catch e}
			<div class="size-full text-start">
				<div class="text-xl text-destructive">{e.error.message}</div>
			</div>
		{/await}
	</div>
	<Editor
		bind:show={showEditor}
		onsave={(e) => {
			console.log(e);
		}}
		onclose={(e: any) => {
			tbl?.exec('close-editor', e);
		}}
		bind:values={selection}
		config={editorConfig}
	/>
{/if}

<style>
	.wx-theme {
		/* base colors */
		--wx-color-primary: var(--color-active);
		--wx-color-primary-font: var(--color-primary-foreground);
		--wx-color-primary-selected: var(--color-active);
		--wx-color-secondary: var(--wx-color-secondary);
		--wx-color-secondary-hover: var(--color-hover);
		--wx-color-secondary-font: var(--color-secondary-foreground);
		--wx-color-secondary-font-hover: var(--color-accent);
		--wx-color-secondary-border: var(--wx-color-primary);
		--wx-color-secondary-border-disabled: var(--color-muted);

		--wx-color-success: var(--color-green-500);
		--wx-color-warning: var(--color-yellow-500);
		--wx-color-info: var(--wx-color-primary);
		--wx-color-danger: var(--color-destructive);
		--wx-color-disabled: var(--color-muted);
		--wx-color-disabled-alt: var(--color-muted-foreground);

		--wx-color-font: var(--color-foreground);
		--wx-color-font-alt: var(--color-secondary-foreground);
		--wx-color-font-disabled: var(--color-muted-foreground);
		--wx-color-link: var(--wx-color-primary);

		--wx-background: var(--background);
		--wx-background-alt: var(--secondary);
		--wx-background-hover: var(--color-hover);
		/* end base colors */

		/* font */
		--wx-font-family: 'Open Sans', Arial, Helvetica, sans-serif;
		--wx-font-size: 14px;
		--wx-line-height: 20px;
		--wx-font-size-md: 14px;
		--wx-line-height-md: 24px;
		--wx-font-size-hd: 16px;
		--wx-line-height-hd: 30px;
		--wx-font-size-sm: 12px;
		--wx-line-height-sm: 16px;
		--wx-font-weight: 400;
		--wx-font-weight-md: 600;
		--wx-font-weight-b: 700;
		/* end font */

		/* other */
		--wx-border-color: var(--color-border);
		--wx-border: 1px solid var(--wx-border-color);
		--wx-border-radius: var(--radius);
		--wx-radius-major: var(--radius-xl);

		--wx-border-light: 1px solid var(--wx-border-color);
		--wx-border-medium: 1px solid var(--wx-border-color);

		--wx-shadow-light: 0px 4px 20px 0px var(--color-stone-300);
		--wx-shadow-medium: none;
		--wx-box-shadow: 0px 4px 48px var(--color-stone-600);
		--wx-box-shadow-strong: 0px 4px 48px var(--color-stone-600), 0px 4px 8px var(--color-black);

		--wx-padding: 8px;
		/* end other */

		/* icons */
		--wx-icon-color: var(--color-foreground);
		--wx-icon-size: var(--wx-line-height);
		--wx-icon-border-radius: var(--wx-border-radius);
		/* end icons */

		/* field */
		--wx-field-gutter: 16px;
		--wx-field-width: 400px;
		/* end field */

		/* input */
		--wx-input-font-family: var(--wx-font-family);
		--wx-input-font-size: var(--wx-font-size);
		--wx-input-line-height: var(--wx-line-height);
		--wx-input-font-weight: var(--wx-font-weight);
		--wx-input-text-align: left;
		--wx-input-font-color: var(--wx-color-font);
		--wx-input-background: var(--color-input);
		--wx-input-background-disabled: var(--wx-color-disabled);
		--wx-input-placeholder-color: var(--wx-color-font-alt);
		--wx-input-border: var(--wx-border);
		--wx-input-border-focus: 0px solid var(--color-hover);
		--wx-input-border-disabled: var(--wx-border);
		--wx-input-border-radius: var(--wx-border-radius);
		--wx-input-height: 32px;
		--wx-input-width: 100%;
		--wx-input-padding: 5px 8px;
		--wx-input-icon-indent: 6px;
		--wx-input-icon-color: var(--wx-icon-color);
		--wx-input-icon-size: var(--wx-icon-size);
		/* end input */

		/* multi combo */
		--wx-multicombo-tag-gap: 3px;
		--wx-multicombo-tag-border: none;
		--wx-multicombo-tag-border-radius: var(--wx-input-border-radius);
		--wx-multicombo-tag-pading: 2px 8px;
		--wx-multicombo-tag-background: var(--wx-background-alt);
		/* end multi combo */

		/* checkbox and radio */
		--wx-checkbox-height: var(--wx-line-height);
		--wx-checkbox-size: var(--wx-checkbox-height);
		--wx-checkbox-border-width: 2px;
		--wx-checkbox-border-color: var(--wx-color-font-alt);
		--wx-checkbox-border-color-disabled: var(--wx-color-disabled);
		--wx-checkbox-border-radius: var(--wx-input-border-radius);
		--wx-checkbox-font-family: var(--wx-font-family);
		--wx-checkbox-font-size: var(--wx-font-size);
		--wx-checkbox-line-height: var(--wx-line-height);
		--wx-checkbox-font-weight: var(--wx-font-weight);
		--wx-checkbox-font-color: var(--wx-color-font);
		/* end checkbox and radio */

		/* label */
		--wx-label-width: 100px;
		--wx-label-margin: 0 0 4px;
		--wx-label-padding: 0;
		--wx-label-font-family: var(--wx-font-family);
		--wx-label-font-size: var(--wx-font-size);
		--wx-label-line-height: var(--wx-line-height);
		--wx-label-font-weight: var(--wx-font-weight-md);
		--wx-label-font-color: var(--wx-color-font);
		/* end label */

		/* button */
		--wx-button-font-family: var(--wx-font-family);
		--wx-button-font-size: var(--wx-font-size-md);
		--wx-button-line-height: var(--wx-line-height);
		--wx-button-font-weight: var(--wx-font-weight-md);
		--wx-button-text-transform: none;
		--wx-button-background: var(--wx-background-alt);
		--wx-button-font-color: var(--wx-color-font);
		--wx-button-danger-font-color: var(--color-foreground);
		--wx-button-border: 1px solid transparent;
		--wx-button-border-radius: var(--wx-border-radius);
		--wx-button-height: 32px;
		--wx-button-padding: 5px 16px;
		--wx-button-icon-indent: 5px;
		--wx-button-icon-size: 20px;

		--wx-button-pressed: var(--color-header);
		--wx-button-danger-pressed: var(--color-destructive);
		--wx-button-primary-pressed: var(--color-active);
		--wx-button-box-shadow:
			-2px -2px 4px 0px var(--color-white) inset, 2px 2px 3px 1px var(--color-black) inset;
		--wx-button-primary-box-shadow:
			-2px -2px 4px 0px var(--color-white) inset, 2px 2px 3px 1px var(--color-black) inset;
		/* end button */

		/* segmented */
		--wx-segmented-background: var(--wx-background-alt);
		--wx-segmented-background-hover: var(--wx-background-hover);
		--wx-segmented-border: none;
		--wx-segmented-border-radius: var(--wx-border-radius);
		--wx-segmented-padding: 0px;
		/* end segmented */

		/* tabs */
		--wx-tabs-background: var(--wx-background);
		--wx-tabs-background-hover: transparent;
		--wx-tabs-hover-border: var(--color-secondary-foreground);
		--wx-tabs-border-width: 1px;
		--wx-tabs-border-radius: var(--wx-border-radius);
		--wx-tabs-divider-width: 1px;
		--wx-tabs-divider-height: 60%;
		--wx-tabs-divider-color: transparent;
		--wx-tabs-cell-min-width: 100px;
		--wx-tabs-active-background: transparent;
		--wx-tabs-active-color: var(--wx-color-primary);
		--wx-tabs-active-border: var(--wx-tabs-active-color);
		/* end tabs */

		/* slider */
		--wx-slider-height: 14px;
		--wx-slider-primary: var(--wx-color-primary);
		--wx-slider-background: var(--wx-background-alt);
		--wx-slider-track-height: 4px;
		--wx-slider-track-border-radius: var(--wx-border-radius);
		--wx-slider-thumb-size: var(--wx-slider-height);
		--wx-slider-thumb-border: none;
		--wx-slider-thumb-border-disabled: 1px solid var(--wx-color-disabled);
		--wx-slider-thumb-shadow: none;
		--wx-slider-label-margin: 0 0 5px;
		--wx-slider-label-font-family: var(--wx-font-family);
		--wx-slider-label-font-size: var(--wx-font-size);
		--wx-slider-label-line-height: var(--wx-line-height);
		--wx-slider-label-font-weight: var(--wx-font-weight-md);
		--wx-slider-label-font-color: var(--wx-color-font);
		/* end slider */

		/* switch */
		--wx-switch-primary: var(--wx-color-primary);
		--wx-switch-background: var(--color-input);
		--wx-switch-width: 48px;
		--wx-switch-height: 24px;
		--wx-switch-border-width: 0px;
		--wx-switch-border-color: transparent;
		--wx-switch-border-color-disabled: transparent;
		--wx-switch-thumb-offset: 1px;
		--wx-switch-thumb-border: none;
		--wx-switch-thumb-border-disabled: 1px solid var(--color-muted-foreground);
		--wx-switch-thumb-background: var(--color-foreground);
		--wx-switch-thumb-background-disabled: var(--wx-color-disabled);
		--wx-switch-thumb-shadow: none;
		/* end switch */

		/* popup and dropdown */
		--wx-popup-z-index: 1001;
		--wx-popup-background: var(--wx-background);
		--wx-popup-shadow: var(--wx-shadow-light);
		--wx-popup-border: 1px solid var(--color-border);
		--wx-popup-border-radius: var(--wx-border-radius);
		/* end popup and dropdown */

		/* modal */
		--wx-modal-z-index: 1000;
		--wx-modal-background: var(--wx-background);
		--wx-modal-shadow: var(--wx-shadow-medium);
		--wx-modal-border: 1px solid var(--color-border);
		--wx-modal-border-radius: var(--wx-border-radius);
		--wx-modal-width: 280px;
		--wx-modal-padding: 16px 20px;
		--wx-modal-gutter: 14px;
		--wx-modal-backdrop: var(--color-black);
		--wx-modal-header-font-family: var(--wx-font-family);
		--wx-modal-header-font-size: var(--wx-font-size-hd);
		--wx-modal-header-line-height: var(--wx-line-height-hd);
		--wx-modal-header-font-weight: var(--wx-font-weight-b);
		--wx-modal-header-font-color: var(--color-foreground);
		/* end modal */

		/* notice */
		--wx-notice-z-index: 1010;
		--wx-notice-background: var(--wx-background-alt);
		--wx-notice-shadow: var(--wx-shadow-medium);
		--wx-notice-border: none;
		--wx-notice-border-radius: 0 var(--wx-border-radius) var(--wx-border-radius) 0;
		--wx-notice-margin: 6px 12px;
		--wx-notice-font-family: var(--wx-font-family);
		--wx-notice-font-size: var(--wx-font-size);
		--wx-notice-line-height: var(--wx-line-height);
		--wx-notice-font-weight: var(--wx-font-weight);
		--wx-notice-font-color: var(--wx-color-font);
		--wx-notice-padding: 14px;
		--wx-notice-width: 240px;
		--wx-notice-icon-size: var(--wx-icon-size);
		--wx-notice-icon-color: var(--wx-icon-color);
		--wx-notice-type-border-width: 4px;
		--wx-notice-type-border-color: var(--wx-icon-color);
		--wx-notice-type-font-color: var(--wx-color-font);
		--wx-notice-type-icon-color: var(--color-secondary-foreground);
		--wx-notice-type-background-opacity: 0;
		--wx-notice-type-close-hover-opacity: 1;
		/* end notice */

		/* calendar */
		--wx-calendar-padding: 16px;
		--wx-calendar-cell-size: 32px;
		--wx-calendar-gap: 4px;
		--wx-calendar-line-gap: 4px;
		--wx-calendar-border-radius: var(--wx-border-radius);
		--wx-calendar-font-family: var(--wx-font-family);
		--wx-calendar-font-size: var(--wx-font-size);
		--wx-calendar-line-height: var(--wx-line-height);
		--wx-calendar-font-weight: var(--wx-font-weight);
		--wx-calendar-font-color: var(--wx-color-font);
		--wx-calendar-icon-color: var(--wx-icon-color);
		--wx-calendar-icon-size: var(--wx-icon-size);
		--wx-calendar-header-font-size: var(--wx-font-size);
		--wx-calendar-header-line-height: var(--wx-line-height);
		--wx-calendar-header-font-weight: var(--wx-font-weight-md);
		--wx-calendar-controls-font-family: var(--wx-button-font-family);
		--wx-calendar-controls-font-size: var(--wx-font-size);
		--wx-calendar-controls-line-height: var(--wx-line-height);
		--wx-calendar-controls-font-weight: var(--wx-font-weight);
		--wx-calendar-controls-font-color: var(--wx-color-font);
		/* end calendar */

		/* tooltip */
		--wx-tooltip-font: var(--wx-font-weight) var(--wx-font-size) var(--wx-font-family);
		--wx-tooltip-font-color: var(--color-popover-foreground);
		--wx-tooltip-background: var(--color-popover);
		--wx-tooltip-border: var(--wx-border-color);
		--wx-tooltip-padding: 4px 8px;
		--wx-tooltip-point-offset: 14px;
		--wx-tooltip-arrow-size: 6px;
		--wx-tooltip-z-index: 1002;
		/* end tooltip */
	}
	.wx-theme {
		font-family: var(--wx-font-family);
		font-size: var(--wx-font-size);
		line-height: var(--wx-line-height);
		font-weight: var(--wx-font-weight);
		font-style: normal;
		letter-spacing: normal;
		text-align: left;
		color: var(--wx-color-font);
		background: var(--wx-background);
	}
	.wx-theme *,
	.wx-theme *:before,
	.wx-theme *:after {
		box-sizing: border-box;
	}
	.wx-theme {
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
