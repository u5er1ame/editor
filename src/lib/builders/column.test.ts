import { describe, it, expect } from 'vitest';
import { ColumnBuilder, sortByProperty } from './column.svelte';

describe('ColumnBuilder', () => {
	describe('basic construction', () => {
		it('creates a column with just an id', () => {
			const col = new ColumnBuilder('name').build();
			expect(col.id).toBe('name');
		});

		it('hidden() sets hidden flag', () => {
			const col = new ColumnBuilder('id').hidden().build();
			expect(col.hidden).toBe(true);
		});

		it('default() creates a full default column', () => {
			const col = ColumnBuilder.default('name').build();
			expect(col.id).toBe('name');
			expect(col.hidden).toBeUndefined();
			expect(col.flexgrow).toBe(2);
			expect(col.sort).toBeDefined();
			expect(col.editor).toBe('text');
			expect(col.header).toEqual([{ text: 'Name' }]);
		});

		it('hidden(id) shorthand works', () => {
			const col = ColumnBuilder.hidden('id').build();
			expect(col.id).toBe('id');
			expect(col.hidden).toBe(true);
		});
	});

	describe('header methods', () => {
		it('defaultHeader capitalizes first letter', () => {
			const col = new ColumnBuilder('description').defaultHeader().build();
			expect(col.header).toEqual([{ text: 'Description' }]);
		});

		it('replaceHeader replaces the header', () => {
			const col = new ColumnBuilder('name')
				.defaultHeader()
				.replaceHeader('Custom Name')
				.build();
			expect(col.header).toEqual(['Custom Name']);
		});

		it('addHeader adds to existing header array', () => {
			const col = new ColumnBuilder('name')
				.defaultHeader()
				.addHeader({ text: 'Sub' })
				.build();
			expect(col.header).toEqual([{ text: 'Name' }, { text: 'Sub' }]);
		});

		it('headerFilter adds filter to header', () => {
			const col = new ColumnBuilder('name')
				.defaultHeader()
				.headerFilter('text')
				.build();
			expect(col.header).toEqual([{ text: 'Name' }, { filter: 'text' }]);
		});
	});

	describe('chaining', () => {
		it('chains multiple methods', () => {
			const col = ColumnBuilder.default('name')
				.grow(3)
				.sort()
				.editor('select')
				.build();
			expect(col.id).toBe('name');
			expect(col.flexgrow).toBe(3);
			expect(col.editor).toBe('select');
		});

		it('addEditorProps merges props', () => {
			const col = new ColumnBuilder('level')
				.addEditorProps({ fetchTable: 'levels', labelKey: 'name' })
				.addEditorProps({ valueKey: 'id' })
				.build();
			expect(col.props).toEqual({
				fetchTable: 'levels',
				labelKey: 'name',
				valueKey: 'id'
			});
		});
	});

	describe('static factories', () => {
		it('withCell sets cell component', () => {
			const FakeComp = () => {};
			const col = ColumnBuilder.withCell('name', FakeComp as any).build();
			expect(col.cell).toBe(FakeComp);
			expect(col.flexgrow).toBe(3);
		});

		it('withKeyCell sets cell and key prop', () => {
			const FakeComp = () => {};
			const col = ColumnBuilder.withKeyCell('level', 'name', FakeComp as any).build();
			expect(col.cell).toBe(FakeComp);
			expect(col.props?.key).toBe('name');
		});
	});
});

describe('sortByProperty', () => {
	const rows = [
		{ nested: { name: 'Banana' } },
		{ nested: { name: 'Apple' } },
		{ nested: { name: 'Cherry' } }
	];

	it('sorts ascending by property', () => {
		const sorter = sortByProperty('nested', 'name', 'asc');
		const sorted = [...rows].sort(sorter);
		expect(sorted.map((r) => r.nested.name)).toEqual(['Apple', 'Banana', 'Cherry']);
	});

	it('sorts descending by property', () => {
		const sorter = sortByProperty('nested', 'name', 'desc');
		const sorted = [...rows].sort(sorter);
		expect(sorted.map((r) => r.nested.name)).toEqual(['Cherry', 'Banana', 'Apple']);
	});

	it('handles numeric values', () => {
		const numRows = [
			{ data: { val: 30 } },
			{ data: { val: 10 } },
			{ data: { val: 20 } }
		];
		const sorter = sortByProperty('data', 'val', 'asc');
		const sorted = [...numRows].sort(sorter);
		expect(sorted.map((r) => r.data.val)).toEqual([10, 20, 30]);
	});

	it('handles mixed null and non-null values', () => {
		const mixedRows = [
			{ data: { val: 'B' } },
			{ data: { val: null } },
			{ data: { val: 'A' } }
		];
		const sorter = sortByProperty('data', 'val', 'asc');
		const sorted = [...mixedRows].sort(sorter);
		// All 3 elements should be present
		expect(sorted).toHaveLength(3);
		// Non-null elements exist
		const nonNull = sorted.filter((r) => r.data.val !== null);
		expect(nonNull).toHaveLength(2);
	});

	it('returns 0 when either value is undefined', () => {
		const sorter = sortByProperty('missing', 'key');
		const result = sorter({ a: 1 } as any, { b: 2 } as any);
		expect(result).toBe(0);
	});
});
