import { describe, it, expect, beforeAll } from 'vitest';
import { schemaStore, TABLES } from './schemas';

// ── Integration: schemas vs running SurrealDB ──────────────────────
// The app loads table names from SurrealDB at runtime via
// `info for db structure`. These tests verify that every table
// in the DB has a corresponding Zod schema, and that the schemas
// are structurally valid.
//
// Requires: SurrealDB running + dev server at APP_URL.
// Run: APP_URL=http://localhost:5173 npx vitest --run --project server

const APP_URL = process.env.APP_URL ?? 'http://localhost:5173';

let dbAvailable = false;
let dbTables: string[] = [];

beforeAll(async () => {
	try {
		const readyRes = await fetch(`${APP_URL}/api/v1/db/ready`, { signal: AbortSignal.timeout(3000) });
		if (!readyRes.ok) return;

		const infoRes = await fetch(`${APP_URL}/api/v1/db/info`, { signal: AbortSignal.timeout(3000) });
		if (!infoRes.ok) return;

		const info = await infoRes.json();
		if (info.tables) {
			dbTables = info.tables.map((t: any) => t.name);
			dbAvailable = true;
		}
	} catch {
		// Dev server not running — skip integration tests
	}
});

describe('DB ↔ schema table list', () => {
	it.skipIf(!dbAvailable)('every DB table has a registered schema', () => {
		expect(dbTables.length).toBeGreaterThan(0);
		for (const table of dbTables) {
			expect(
				schemaStore.store.has(table as any),
				`DB table "${table}" has no schema in schemaStore`
			).toBe(true);
		}
	});

	it.skipIf(!dbAvailable)('every schema has a corresponding DB table', () => {
		const dbSet = new Set(dbTables);
		for (const [name] of schemaStore.store) {
			expect(
				dbSet.has(name),
				`Schema "${name}" registered but not found in DB tables`
			).toBe(true);
		}
	});

	it('TABLES constant matches schemaStore keys', () => {
		const tableSet = new Set(TABLES);
		const schemaKeys = new Set(schemaStore.store.keys());

		for (const t of TABLES) {
			expect(schemaKeys.has(t), `TABLES has "${t}" but no schema`).toBe(true);
		}
		for (const s of schemaKeys) {
			expect(tableSet.has(s), `Schema "${s}" not in TABLES`).toBe(true);
		}
	});
});

describe('Schema structure', () => {
	it('every schema has server, client, and query', () => {
		for (const [name, entry] of schemaStore.store) {
			expect(entry.server, `${name}: missing server schema`).toBeDefined();
			expect(entry.client, `${name}: missing client schema`).toBeDefined();
			expect(entry.query, `${name}: missing query`).toBeDefined();
		}
	});

	it('every server schema has an id field', () => {
		for (const [name, entry] of schemaStore.store) {
			const shape = (entry.server as any).shape;
			expect(shape, `${name}: schema has no shape`).toBeDefined();
			expect(shape.id, `${name}: missing "id" field`).toBeDefined();
		}
	});
});
