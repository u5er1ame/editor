import { jsonify, surql, Table, RecordId } from 'surrealdb';
import { error } from '@sveltejs/kit';
import { getRequestEvent, query } from '$app/server';
import { env } from '$env/dynamic/private';
import { type DatabaseInfo, type NamespaceInfo, type SystemInfo } from '$lib/server/root_db.svelte';
import { goto } from '$app/navigation';
import z from 'zod/v4';
import { schemaStore, type ClientData, type ServerData } from './model/schemas';
import type { Tables } from './model/types';

// ── Helpers ──────────────────────────────────────────────────────────
/** Ensure the DB connection is alive, ready, and switched to the active database. */
async function getDb() {
	const { locals, fetch } = getRequestEvent();
	const db = locals.db.instance;
	if (!db.isConnected) error(500, 'DB not connected');
	await db.ready.catch(() => {
		return error(500, 'DB not ready');
	});
	db.use({ database: locals.db.database });
	return db;
}

// ── System / auth queries ────────────────────────────────────────────
export const connect_system = query(async () => {
	const { locals } = getRequestEvent();
	const root_access = locals.db.root_instance;
	const isConnected = await root_access
		.connect(env.SURREAL_URL, {
			authentication: {
				username: env.SURREAL_ROOT_VIEWER_USER,
				password: env.SURREAL_ROOT_VIEWER_PASS
			}
		})
		.catch(() => false);
	return { isConnected };
});

export const getSystemInfo = query(async () => {
	const { locals } = getRequestEvent();
	const root_access = locals.db.root_instance;
	if (!root_access.isConnected) return;
	await root_access.ready.catch(() => {});
	const [res] = await root_access
		.query<[{ system: SystemInfo; defaults: { namespace: string; database: string } }]>(
			'info for root structure'
		)
		.catch(() => {
			return [];
		});
	return jsonify(res);
});

export const connect = query(async () => {
	const { locals } = getRequestEvent();
	const db = locals.db.instance;
	const isConnected = await db.connect(env.SURREAL_URL).catch(() => false);
	return isConnected;
});

export const getStatus = query(async () => {
	const { locals } = getRequestEvent();
	const db = locals.db.instance;
	return db.status;
});

export const getNamespaceInfo = query(async () => {
	const { locals } = getRequestEvent();
	const db = locals.db.instance;
	if (!db.isConnected) error(500, 'Cant get NS info DB not connected');
	await db.ready;
	const [res] = await db.query<[NamespaceInfo]>('info for ns structure').catch((e) => {
		console.error(e);
		return [];
	});
	return res ?? {};
});

// ── Database info ────────────────────────────────────────────────────
export const getDatabaseInfo = query(async () => {
	const db = await getDb();
	const [res] = await db.query<[DatabaseInfo]>('info for db structure');
	return res ?? {};
});

// ── Data queries ─────────────────────────────────────────────────────
export const getDataClient = query(
	z.custom<Tables>((v) => typeof v === 'string' && schemaStore.store.has(v as Tables), {
		error: (iss) => `Schema not found for table ${iss.input}`
	}),
	async (table) => {
		const db = await getDb();
		const query = schemaStore.store.get(table)!.query;
		const [res] = await db.query<[ClientData[]]>(query);
		return jsonify(res ?? []);
	}
);

export const getData = query(
	z.custom<Tables>((v) => typeof v === 'string' && schemaStore.store.has(v as Tables), {
		error: (iss) => `Schema not found for table ${iss.input}`
	}),
	async (table) => {
		const db = await getDb();
		const res = await db.select<ServerData>(new Table(table)).catch((e: any) => {
			return error(500, { message: 'Failed to fetch data' });
		});
		return jsonify(res ?? []);
	}
);

export const getTableStructure = query(
	z.string().refine((v) => schemaStore.store.has(v as Tables), {
		error: (iss) => `Schema not found for table ${iss.input}`
	}),
	async (table) => {
		const db = await getDb();
		const [res] = await db.query(surql`info for table ${table} structure`);
		return res ?? [];
	}
);

export const generateId = query(z.string(), async (table: string) => {
	const db = await getDb();
	const [id] = await db.query<[string]>('rand::id()');
	if (!id) return error(500, 'Failed to generate ID');
	return { id: new RecordId(table, id).toString() };
});

// ── Mutations ────────────────────────────────────────────────────────
export const updateRecord = query(
	z.object({
		table: z.string(),
		id: z.string(),
		changes: z.record(z.string(), z.any())
	}),
	async ({ table, id, changes }) => {
		const db = await getDb();

		const entry = schemaStore.store.get(table as Tables);
		if (!entry) return error(400, `Unknown table: ${table}`);

		const serverSchema = entry.server;
		const { id: _id, ...dbChanges } = changes;

		const normalized: Record<string, any> = {};
		for (const [key, val] of Object.entries(dbChanges)) {
			if (key in serverSchema.shape) {
				normalized[key] = val && typeof val === 'object' && val.id ? val.id : val;
			}
		}

		// Validate only changed fields against server schema
		const changedFieldsSchema = serverSchema.partial();
		const validation = changedFieldsSchema.safeParse(normalized);
		if (!validation.success) {
			return error(400, { message: validation.error.message });
		}

		const recordId = new RecordId(table, id.split(':')[1] ?? id);
		const patched = await db
			.update(recordId)
			.merge(normalized)
			.catch((e: any) => {
				return error(500, { message: 'Failed to update record' });
			});
		return jsonify(patched);
	}
);

export const insertRecord = query(
	z.object({
		table: z.string(),
		data: z.record(z.string(), z.any())
	}),
	async ({ table, data }) => {
		const db = await getDb();

		const entry = schemaStore.store.get(table as Tables);
		if (!entry) return error(400, `Unknown table: ${table}`);

		const serverSchema = entry.server;
		const { id: rawId, ...rest } = data;

		const normalized: Record<string, any> = {};
		for (const [key, val] of Object.entries(rest)) {
			if (key in serverSchema.shape) {
				normalized[key] = val && typeof val === 'object' && val.id ? val.id : val;
			}
		}

		const toInsert = normalized;
		if (rawId) {
			toInsert.id = new RecordId(table, String(rawId).split(':')[1] ?? String(rawId));
		}

		const validation = serverSchema.safeParse(toInsert);
		if (!validation.success) {
			return error(400, { message: validation.error.message });
		}

		const created = await db.insert(new Table(table), toInsert).catch((e: any) => {
			return error(500, { message: 'Failed to insert record' });
		});
		return jsonify(created);
	}
);

export const deleteRecord = query(
	z.object({
		table: z.string(),
		id: z.string()
	}),
	async ({ table, id }) => {
		const db = await getDb();

		const recordId = new RecordId(table, id.split(':')[1] ?? id);
		const deleted = await db.delete(recordId).catch((e: any) => {
			return error(500, { message: 'Failed to delete record' });
		});
		return jsonify(deleted);
	}
);

export const saveGeometry = query(
	z.object({
		table: z.string(),
		id: z.string(),
		geometry: z.object({
			type: z.string(),
			coordinates: z.any()
		})
	}),
	async ({ table, id, geometry }) => {
		const db = await getDb();
		const entry = schemaStore.store.get(table as Tables);
		if (!entry) return error(400, `Unknown table: ${table}`);

		const recordId = new RecordId(table, id.split(':')[1] ?? id);
		const patched = await db
			.update(recordId)
			.merge({ geometry })
			.catch((e: any) => {
				return error(500, { message: 'Failed to save geometry' });
			});
		return jsonify(patched);
	}
);

// ── Session ──────────────────────────────────────────────────────────
export const expire = query(async () => {
	const { locals } = getRequestEvent();
	const db = locals.db.instance;
	if (!db.isConnected) error(500, 'DB not connected');
	await db.invalidate();
	goto('/', { invalidateAll: true });
});
