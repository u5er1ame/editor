import { describe, it, expect } from 'vitest';
import {
	SchemaRegistry,
	LevelSchema,
	ElectricRoomSchema,
	BoardSchema,
	BreakerSchema,
	BreakerConnectionSchema,
	AreaNameSchema,
	ShopSchema,
	TABLES
} from './schemas';

// ── Unit tests: SchemaRegistry class logic ─────────────────────────
describe('SchemaRegistry', () => {
	it('addSchemas stores entry in map', () => {
		const registry = new SchemaRegistry();
		const fakeEntry = { server: LevelSchema, client: LevelSchema, query: {} as any };
		registry.addSchemas('levels', fakeEntry);
		expect(registry.store.has('levels')).toBe(true);
		expect(registry.store.get('levels')).toBe(fakeEntry);
	});

	it('defaultConfig returns id and capitalized label', () => {
		const registry = new SchemaRegistry();
		registry.addSchemas('levels', { server: LevelSchema, client: LevelSchema, query: {} as any });
		const config = registry.defaultConfig('levels');
		expect(config.id).toBe('levels');
		expect(config.label).toBe('Levels');
	});

	it('defaultConfig capitalizes first letter only', () => {
		const registry = new SchemaRegistry();
		registry.addSchemas('electric_rooms', {
			server: ElectricRoomSchema,
			client: ElectricRoomSchema,
			query: {} as any
		});
		const config = registry.defaultConfig('electric_rooms');
		expect(config.label).toBe('Electric_rooms');
	});

	it('defaultConfig throws for unregistered table', () => {
		const registry = new SchemaRegistry();
		expect(() => registry.defaultConfig('nonexistent' as any)).toThrow(
			'Schema not found in registry'
		);
	});

	it('store supports multiple registrations', () => {
		const registry = new SchemaRegistry();
		registry.addSchemas('levels', { server: LevelSchema, client: LevelSchema, query: {} as any });
		registry.addSchemas('boards', { server: BoardSchema, client: BoardSchema, query: {} as any });
		expect(registry.store.size).toBe(2);
		expect(registry.store.has('levels')).toBe(true);
		expect(registry.store.has('boards')).toBe(true);
	});

	it('addSchemas overwrites existing entry', () => {
		const registry = new SchemaRegistry();
		const first = { server: LevelSchema, client: LevelSchema, query: {} as any };
		const second = { server: BoardSchema, client: BoardSchema, query: {} as any };
		registry.addSchemas('levels', first);
		registry.addSchemas('levels', second);
		expect(registry.store.get('levels')).toBe(second);
	});
});

// ── Unit tests: TABLES constant ────────────────────────────────────
describe('TABLES constant', () => {
	it('contains all expected table names', () => {
		expect(TABLES).toContain('levels');
		expect(TABLES).toContain('electric_rooms');
		expect(TABLES).toContain('boards');
		expect(TABLES).toContain('breakers');
		expect(TABLES).toContain('connects');
		expect(TABLES).toContain('area_name');
		expect(TABLES).toContain('shops');
		expect(TABLES).toHaveLength(7);
	});

	it('is a readonly tuple', () => {
		expect(Array.isArray(TABLES)).toBe(true);
		expect(TABLES.length).toBe(7);
	});
});

// ── Unit tests: Zod schema validation (pure, no DB) ───────────────
describe('LevelSchema', () => {
	it('accepts valid level', () => {
		const result = LevelSchema.safeParse({ id: 'levels:test', name: 'Floor 1' });
		expect(result.success).toBe(true);
	});

	it('rejects level without name', () => {
		const result = LevelSchema.safeParse({ id: 'levels:test' });
		expect(result.success).toBe(false);
	});
});

describe('ElectricRoomSchema', () => {
	it('accepts valid room', () => {
		const result = ElectricRoomSchema.safeParse({
			id: 'electric_rooms:test',
			name: 'Room A',
			level: 'levels:1'
		});
		expect(result.success).toBe(true);
	});

	it('rejects room without level', () => {
		const result = ElectricRoomSchema.safeParse({
			id: 'electric_rooms:test',
			name: 'Room A'
		});
		expect(result.success).toBe(false);
	});
});

describe('BoardSchema', () => {
	it('accepts valid board', () => {
		const result = BoardSchema.safeParse({
			id: 'boards:test',
			name: 'Panel 1',
			room: 'electric_rooms:1'
		});
		expect(result.success).toBe(true);
	});

	it('rejects board without room', () => {
		const result = BoardSchema.safeParse({ id: 'boards:test', name: 'Panel 1' });
		expect(result.success).toBe(false);
	});
});

describe('BreakerSchema', () => {
	it('accepts valid breaker with all fields', () => {
		const result = BreakerSchema.safeParse({
			id: 'breakers:test',
			name: 'CB-01',
			current: 100,
			description: 'Main breaker',
			board: 'boards:1'
		});
		expect(result.success).toBe(true);
	});

	it('accepts breaker without optional fields', () => {
		const result = BreakerSchema.safeParse({
			id: 'breakers:test',
			name: 'CB-02',
			board: 'boards:1'
		});
		expect(result.success).toBe(true);
	});

	it('rejects breaker without board', () => {
		const result = BreakerSchema.safeParse({ id: 'breakers:test', name: 'CB-03' });
		expect(result.success).toBe(false);
	});
});

describe('AreaNameSchema', () => {
	it('requires name with min 2 chars', () => {
		const valid = AreaNameSchema.safeParse({
			id: 'area_name:test',
			name: 'Area 1',
			level: 'levels:1'
		});
		expect(valid.success).toBe(true);

		const invalid = AreaNameSchema.safeParse({
			id: 'area_name:test',
			name: 'A',
			level: 'levels:1'
		});
		expect(invalid.success).toBe(false);
	});
});

describe('ShopSchema', () => {
	it('accepts shop without area_name (optional)', () => {
		const result = ShopSchema.safeParse({ id: 'shops:test', name: 'Shop 1' });
		expect(result.success).toBe(true);
	});
});

describe('BreakerConnectionSchema', () => {
	it('accepts valid connection', () => {
		const result = BreakerConnectionSchema.safeParse({
			id: 'connects:test',
			in: 'breakers:1',
			out: 'breakers:2',
			cable: 'Cable A'
		});
		expect(result.success).toBe(true);
	});

	it('accepts connection without cable', () => {
		const result = BreakerConnectionSchema.safeParse({
			id: 'connects:test',
			in: 'breakers:1',
			out: 'area_name:1'
		});
		expect(result.success).toBe(true);
	});
});
