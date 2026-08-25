import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { env } from '$env/dynamic/private';
import { Surreal, RecordId } from 'surrealdb';

// ── Geometry Data for Mall ──────────────────────────────────────────

const LEVEL_GEOMETRY: Record<string, any> = {
	'1f': {
		type: 'Polygon',
		coordinates: [[[-100, -75], [100, -75], [100, 75], [-100, 75], [-100, -75]]]
	},
	'2f': {
		type: 'Polygon',
		coordinates: [[[-100, 125], [100, 125], [100, 275], [-100, 275], [-100, 125]]]
	},
	'3f': {
		type: 'Polygon',
		coordinates: [[[-100, 325], [100, 325], [100, 475], [-100, 475], [-100, 325]]]
	},
	'p1': {
		type: 'Polygon',
		coordinates: [[[-120, -175], [120, -175], [120, -100], [-120, -100], [-120, -175]]]
	}
};

const AREA_GEOMETRY: Record<string, any> = {
	'north_wing': {
		type: 'Polygon',
		coordinates: [[[-90, -60], [-10, -60], [-10, 60], [-90, 60], [-90, -60]]]
	},
	'south_wing': {
		type: 'Polygon',
		coordinates: [[[10, -60], [90, -60], [90, 60], [10, 60], [10, -60]]]
	},
	'food_court': {
		type: 'Polygon',
		coordinates: [[[-40, -60], [40, -60], [40, -30], [-40, -30], [-40, -60]]]
	},
	'west_wing': {
		type: 'Polygon',
		coordinates: [[[-90, 140], [-10, 140], [-10, 260], [-90, 260], [-90, 140]]]
	},
	'east_wing': {
		type: 'Polygon',
		coordinates: [[[10, 140], [90, 140], [90, 260], [10, 260], [10, 140]]]
	},
	'3f_hm': {
		type: 'Polygon',
		coordinates: [[[-80, 340], [-20, 340], [-20, 460], [-80, 460], [-80, 340]]]
	},
	'3f_sport': {
		type: 'Polygon',
		coordinates: [[[20, 340], [80, 340], [80, 460], [20, 460], [20, 340]]]
	}
};

const ROOM_GEOMETRY: Record<string, any> = {
	'er_1f_main': {
		type: 'Polygon',
		coordinates: [[[-95, -55], [-80, -55], [-80, -40], [-95, -40], [-95, -55]]]
	},
	'er_2f_north': {
		type: 'Polygon',
		coordinates: [[[-95, 145], [-80, 145], [-80, 160], [-95, 160], [-95, 145]]]
	},
	'er_3f_south': {
		type: 'Polygon',
		coordinates: [[[80, 345], [95, 345], [95, 360], [80, 360], [80, 345]]]
	},
	'er_b1_main': {
		type: 'Polygon',
		coordinates: [[[-95, -170], [-80, -170], [-80, -155], [-95, -155], [-95, -170]]]
	},
	'er_elevator': {
		type: 'Polygon',
		coordinates: [[[-5, -55], [5, -55], [5, -40], [-5, -40], [-5, -55]]]
	}
};

// ── POST: Seed Geometry ─────────────────────────────────────────────

export const POST: RequestHandler = async ({ request, locals }) => {
	const { action } = await request.json();

	const db = locals.db.instance;
	if (!db.isConnected) {
		return error(500, 'Database not connected');
	}

	await db.ready;

	try {
		switch (action) {
			case 'seed-geometry':
				return await seedGeometry(db);

			case 'check-geometry':
				return await checkGeometry(db);

			default:
				return error(400, `Unknown action: ${action}`);
		}
	} catch (e: any) {
		console.error('Geometry seed error:', e);
		return error(500, e.message);
	}
};

// ── Seed Geometry ───────────────────────────────────────────────────

async function seedGeometry(db: Surreal) {
	const results = {
		levels: { updated: 0, failed: 0 },
		areas: { updated: 0, failed: 0 },
		rooms: { updated: 0, failed: 0 }
	};

	// Update levels
	for (const [id, geometry] of Object.entries(LEVEL_GEOMETRY)) {
		try {
			await db.query(
				`UPDATE levels:${id} SET geometry = $geometry`,
				{ geometry }
			);
			results.levels.updated++;
		} catch (e) {
			console.warn(`Failed to update level ${id}:`, e);
			results.levels.failed++;
		}
	}

	// Update areas
	for (const [id, geometry] of Object.entries(AREA_GEOMETRY)) {
		try {
			await db.query(
				`UPDATE area_name:${id} SET geometry = $geometry`,
				{ geometry }
			);
			results.areas.updated++;
		} catch (e) {
			console.warn(`Failed to update area ${id}:`, e);
			results.areas.failed++;
		}
	}

	// Update rooms
	for (const [id, geometry] of Object.entries(ROOM_GEOMETRY)) {
		try {
			await db.query(
				`UPDATE electric_rooms:${id} SET geometry = $geometry`,
				{ geometry }
			);
			results.rooms.updated++;
		} catch (e) {
			console.warn(`Failed to update room ${id}:`, e);
			results.rooms.failed++;
		}
	}

	return json({
		success: true,
		results
	});
}

// ── Check Geometry ──────────────────────────────────────────────────

async function checkGeometry(db: Surreal) {
	const results: any = {};

	// Check levels
	const [levels] = await db.query<any[]>(
		`SELECT id, name, geometry FROM levels`
	);
	results.levels = {
		total: levels?.length || 0,
		withGeometry: levels?.filter((l: any) => l.geometry)?.length || 0
	};

	// Check areas
	const [areas] = await db.query<any[]>(
		`SELECT id, name, geometry FROM area_name`
	);
	results.areas = {
		total: areas?.length || 0,
		withGeometry: areas?.filter((a: any) => a.geometry)?.length || 0
	};

	// Check rooms
	const [rooms] = await db.query<any[]>(
		`SELECT id, name, geometry FROM electric_rooms`
	);
	results.rooms = {
		total: rooms?.length || 0,
		withGeometry: rooms?.filter((r: any) => r.geometry)?.length || 0
	};

	return json(results);
}
