import { schemaStore, type ClientSchemas } from '$lib/model/schemas';
import { Room, Board, Breaker } from '$lib/components/nodes/index';
import { ColumnBuilder } from '$lib/builders/column.svelte';
import { GraphConfigBuilder } from '$lib/builders/graph.config';
import { TextCell, SelectCell, ComboCell, GraphButtonCell } from '$lib/components/cells';
import { SelectHeaderFilter } from '$lib/components/header-filters';
import type { IColumn } from '@svar-ui/svelte-grid';
import type { Component } from 'svelte';
import type { Tables, Views } from './model/types';
import type { LayoutOptions } from 'elkjs/lib/elk-api';

// Cast cell components to avoid type mismatches
const TextCellComp = TextCell as Component<any>;
const SelectCellComp = SelectCell as Component<any>;
const ComboCellComp = ComboCell as Component<any>;

// ── Graph button column (shown when table has graph view) ───────────
const GraphButtonColumn: IColumn = {
	id: 'left:actions',
	hidden: false,
	flexgrow: 0,
	left: 0,
	header: [{ text: 'Actions' }],
	cell: GraphButtonCell,
	resize: false
};

// ── Layout options per table ────────────────────────────────────────
const layoutOptions: Record<string, LayoutOptions> = {
	electric_rooms: {
		'elk.algorithm': 'layered',
		'elk.direction': 'DOWN',
		hierarchyHandling: 'INCLUDE_CHILDREN',
		'elk.padding.top': '16',
		'elk.padding.left': '16',
		'elk.padding.bottom': '16',
		'elk.padding.right': '16',
		'elk.contentAlignment': 'V_CENTER H_CENTER',
		'elk.layered.nodePlacement.bk.fixedAlignment': 'BALANCED',
		'elk.spacing.nodeNode': '16'
	},
	boards: {
		'elk.algorithm': 'layered',
		'elk.direction': 'RIGHT',
		hierarchyHandling: 'INCLUDE_CHILDREN',
		'elk.padding.top': '40',
		'elk.padding.left': '20',
		'elk.padding.bottom': '20',
		'elk.padding.right': '20',
		'elk.contentAlignment': 'V_CENTER H_CENTER',
		'elk.layered.nodePlacement.bk.fixedAlignment': 'BALANCED',
		'elk.spacing.nodeNode': '30'
	},
	breakers: {
		'elk.algorithm': 'layered',
		'elk.direction': 'DOWN',
		'elk.edgeRouting': 'POLYLINE',
		'elk.padding.top': '10',
		'elk.padding.left': '10',
		'elk.padding.bottom': '10',
		'elk.padding.right': '10',
		'elk.contentAlignment': 'V_CENTER H_CENTER',
		'elk.layered.nodePlacement.bk.fixedAlignment': 'BALANCED',
		'elk.spacing.nodeNode': '20'
	}
};

export function getLayoutOptions(table: string): LayoutOptions | undefined {
	return layoutOptions[table];
}

// ── Graph configs per table ─────────────────────────────────────────
type GraphConfigBuilderFn = () => ReturnType<GraphConfigBuilder['build']>;

const graphConfigs: Partial<Record<Tables, GraphConfigBuilderFn>> = {
	electric_rooms: () =>
		new GraphConfigBuilder()
			.labelKey('name')
			.elkConfig(layoutOptions.electric_rooms)
			.flowConfig()
			.type('node')
			.component('electric_rooms', Room)
			.build(),
	boards: () =>
		new GraphConfigBuilder()
			.labelKey('name')
			.elkConfig(layoutOptions.boards)
			.flowConfig()
			.type('node')
			.parentIDKey('room')
			.component('boards', Board)
			.build(),
	breakers: () =>
		new GraphConfigBuilder()
			.labelKey('name')
			.elkConfig(layoutOptions.breakers)
			.flowConfig()
			.type('node')
			.flowConfig({ connectable: true })
			.parentIDKey('board')
			.component('breakers', Breaker)
			.build(),
	connects: () =>
		new GraphConfigBuilder()
			.labelKey('name')
			.elkConfig(layoutOptions.breakers)
			.flowConfig()
			.type('edge')
			.flowConfig({ animated: true })
			.build()
};

export function addTableMetadata(name: Tables) {
	const builder = graphConfigs[name];
	if (!builder) throw new Error(`No graph config for table: ${name}`);
	return { graph: builder() };
}

// ── Field-level column configs ──────────────────────────────────────
type FieldConfigFn = (key: string, fieldSchema: any, tableName?: string) => IColumn;

const text = (key: string) => ColumnBuilder.default(key).cell(TextCellComp).build();

const fieldConfigs: Record<string, FieldConfigFn> = {
	id: (key) => ColumnBuilder.hidden(key).build(),

	name: (key, _, tableName) => {
		if (tableName === 'levels') return text(key);
		return ColumnBuilder.default(key).headerFilter('text').cell(TextCellComp).build();
	},

	level: (key, fs) => {
		if (fs.type == 'object') {
			return ColumnBuilder.withKeyCell(key, 'name', SelectCellComp)
				.headertextWithFilter('Level', SelectHeaderFilter, {
					fetchTable: 'levels',
					labelKey: 'name',
					valueKey: 'id'
				})
				.editor({
					type: 'select',
					config: { fetchTable: 'levels', labelKey: 'name', valueKey: 'id' }
				})
				.build();
		}
		return text(key);
	},

	area_name: (key, fs) => {
		if (fs.type == 'object') {
			return ColumnBuilder.withKeyCell(key, 'name', ComboCellComp)
				.headertextWithFilter('Area', SelectHeaderFilter, {
					fetchTable: 'levels',
					labelKey: 'name',
					valueKey: 'id',
					filterPath: 'level.id'
				})
				.addEditorProps({ displayFormat: '{level.name} / {name}' })
				.editor({
					type: 'combo',
					config: { fetchTable: 'area_name', labelKey: 'name', valueKey: 'id' }
				})
				.build();
		}
		return text(key);
	},

	shop: (key, fs) => {
		if (fs.type == 'object') {
			return ColumnBuilder.withKeyCell(key, 'name', ComboCellComp)
				.headertextWithFilter('Shop', SelectHeaderFilter, {
					fetchTable: 'area_name',
					labelKey: 'name',
					valueKey: 'id'
				})
				.addEditorProps({ displayFormat: '{area_name.level.name} / {area_name.name} / {name}' })
				.editor({
					type: 'combo',
					config: { fetchTable: 'shops', labelKey: 'name', valueKey: 'id' }
				})
				.build();
		}
		return text(key);
	},

	room: (key, fs, tableName) => {
		if (fs.type == 'object') {
			const builder = ColumnBuilder.withKeyCell(key, 'name', SelectCellComp)
				.headertextWithFilter('Room', SelectHeaderFilter, {
					fetchTable: 'electric_rooms',
					labelKey: 'name',
					valueKey: 'id',
					filterPath: 'id'
				})
				.editor({
					type: 'select',
					config: { fetchTable: 'electric_rooms', labelKey: 'name', valueKey: 'id' }
				});
			// boards.room: room is the leaf — no parent context needed
			// other tables (e.g. breakers): room is nested under something, disambiguate with parent
			if (tableName !== 'boards') {
				builder.addEditorProps({ displayFormat: '{level.name} / {name}' });
			} else {
				builder.addEditorProps({ showRawLabel: true });
			}
			return builder.build();
		}
		return text(key);
	},

	board: (key, fs, tableName) => {
		if (fs.type == 'object') {
			const builder = ColumnBuilder.withKeyCell(key, 'name', SelectCellComp)
				.headertextWithFilter('Board', SelectHeaderFilter, {
					fetchTable: 'electric_rooms',
					labelKey: 'name',
					valueKey: 'id',
					filterPath: 'room.id'
				})
				.editor({
					type: 'select',
					config: { fetchTable: 'boards', labelKey: 'name', valueKey: 'id' }
				});
			// boards.board doesn't make sense (a board has no parent board)
			// breakers.board: disambiguate by parent room
			if (tableName === 'breakers') {
				builder.addEditorProps({ displayFormat: '{room.name} / {name}' });
			}
			return builder.build();
		}
		return text(key);
	},

	current: text,
	description: text,
	cable: text,

	in: (key) => ColumnBuilder.withKeyCell(key, 'name', SelectCellComp).build(),
	out: (key) => ColumnBuilder.withKeyCell(key, 'name', SelectCellComp).build()
};

export function addFieldsMetadata(
	schema: ClientSchemas,
	hasGraphView: boolean = false,
	tableName?: string
) {
	const meta: { [key in Views]?: any } = { table: [] };

	if (hasGraphView) {
		meta.table.push(GraphButtonColumn);
	}

	for (const key of Object.keys(schema.shape)) {
		const fieldSchema = (schema.shape as Record<string, any>)[key];
		const configFn = fieldConfigs[key] ?? text;
		meta.table.push(configFn(key, fieldSchema, tableName));
	}

	return meta;
}
