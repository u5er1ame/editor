import { describe, it, expect } from 'vitest';
import type { App } from '@sveltejs/kit';

describe('PageState transitions', () => {
	it('table view state has correct shape', () => {
		const state: App.PageState = {
			table: { selected_tab: 'breakers' },
			selectedRow: 'breakers:abc123',
			selectedTable: 'breakers'
		};
		expect(state.table?.selected_tab).toBe('breakers');
		expect(state.selectedRow).toBe('breakers:abc123');
		expect(state.selectedTable).toBe('breakers');
	});

	it('graph view state has correct shape', () => {
		const state: App.PageState = {
			graph: { selectedNodeId: 'electric_rooms:1' }
		};
		expect(state.graph?.selectedNodeId).toBe('electric_rooms:1');
	});

	it('combined transition state preserves both views', () => {
		// Simulate: user is on table, clicks "show in graph", navigates to graph
		const tableState: App.PageState = {
			table: { selected_tab: 'breakers' },
			selectedRow: 'breakers:abc123',
			selectedTable: 'breakers'
		};
		const graphState: App.PageState = {
			...tableState,
			graph: { selectedNodeId: 'breakers:abc123' }
		};
		expect(graphState.table?.selected_tab).toBe('breakers');
		expect(graphState.selectedRow).toBe('breakers:abc123');
		expect(graphState.graph?.selectedNodeId).toBe('breakers:abc123');
	});

	it('row ID matches node ID format', () => {
		// SurrealDB record IDs like "breakers:abc123" are used as both row IDs and node IDs
		const rowId = 'breakers:abc123';
		const nodeId = rowId; // Same format
		expect(nodeId).toBe('breakers:abc123');
		expect(nodeId.startsWith('breakers:')).toBe(true);
	});

	it('selectedRow prefix matches table name for filtering', () => {
		const selectedRow = 'breakers:abc123';
		const tableName = 'breakers';
		expect(selectedRow.startsWith(tableName + ':')).toBe(true);
	});
});
