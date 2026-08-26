import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { Surreal } from 'surrealdb';
import { env } from '$env/dynamic/private';

// ── GET: Map Data ───────────────────────────────────────────────────

export const GET: RequestHandler = async ({ url, locals }) => {
	const db = locals.db.instance;
	if (!db.isConnected) {
		return error(500, 'Database not connected');
	}

	await db.ready;

	const table = url.searchParams.get('table');

	// Tables that might have geometry
	const geometryTables = ['levels', 'area_name', 'zones', 'electric_rooms', 'boards', 'connects'];

	const mapData: any[] = [];

	// If specific table requested, only fetch that one
	const tablesToFetch = table && geometryTables.includes(table) ? [table] : geometryTables;

	for (const tableName of tablesToFetch) {
		try {
			// Query for records with geometry
			const [records] = await db.query<any[]>(
				`SELECT id, name, geometry FROM ${tableName} WHERE geometry != NONE`
			);

			if (records && records.length > 0) {
				const features = records
					.filter((r: any) => r.geometry)
					.map((r: any) => ({
						id: r.id?.toString() || '',
						properties: {
							name: r.name || r.id?.toString() || 'Unknown'
						},
						geometry: r.geometry
					}));

				if (features.length > 0) {
					mapData.push({
						table: tableName,
						features
					});
				}
			}
		} catch (e) {
			console.warn(`Failed to fetch geometry for ${tableName}:`, e);
		}
	}

	// If no real geometry data, return sample data for demo
	if (mapData.length === 0) {
		return json(getSampleData());
	}

	return json(mapData);
};

// ── Sample Data (fallback) ──────────────────────────────────────────

function getSampleData() {
	const makeRect = (cx: number, cy: number, w: number, h: number): number[][] => {
		const hw = w / 2, hh = h / 2;
		return [
			[cx - hw, cy - hh],
			[cx + hw, cy - hh],
			[cx + hw, cy + hh],
			[cx - hw, cy + hh],
			[cx - hw, cy - hh]
		];
	};

	return [
		{
			table: 'levels',
			features: [
				{
					id: 'levels:1f',
					properties: { name: 'Floor 1' },
					geometry: { type: 'Polygon', coordinates: [makeRect(0, 0, 200, 150)] }
				},
				{
					id: 'levels:2f',
					properties: { name: 'Floor 2' },
					geometry: { type: 'Polygon', coordinates: [makeRect(0, 200, 200, 150)] }
				},
				{
					id: 'levels:3f',
					properties: { name: 'Floor 3' },
					geometry: { type: 'Polygon', coordinates: [makeRect(0, 400, 200, 150)] }
				}
			]
		},
		{
			table: 'area_name',
			features: [
				{
					id: 'area_name:north_wing',
					properties: { name: 'North Wing' },
					geometry: { type: 'Polygon', coordinates: [makeRect(-60, 0, 80, 120)] }
				},
				{
					id: 'area_name:south_wing',
					properties: { name: 'South Wing' },
					geometry: { type: 'Polygon', coordinates: [makeRect(60, 0, 80, 120)] }
				},
				{
					id: 'area_name:food_court',
					properties: { name: 'Food Court' },
					geometry: { type: 'Polygon', coordinates: [makeRect(0, -50, 60, 40)] }
				},
				{
					id: 'area_name:parking',
					properties: { name: 'Parking' },
					geometry: { type: 'Polygon', coordinates: [makeRect(0, 300, 180, 80)] }
				}
			]
		},
		{
			table: 'electric_rooms',
			features: [
				{
					id: 'electric_rooms:er_1f_main',
					properties: { name: 'ER 1F Main' },
					geometry: { type: 'Polygon', coordinates: [makeRect(-80, -20, 15, 15)] }
				},
				{
					id: 'electric_rooms:er_2f_north',
					properties: { name: 'ER 2F North' },
					geometry: { type: 'Polygon', coordinates: [makeRect(-80, 180, 15, 15)] }
				},
				{
					id: 'electric_rooms:er_3f_south',
					properties: { name: 'ER 3F South' },
					geometry: { type: 'Polygon', coordinates: [makeRect(80, 380, 15, 15)] }
				}
			]
		},
		{
			table: 'connects',
			features: [
				{
					id: 'connects:cable1',
					properties: { name: 'Main Feed' },
					geometry: {
						type: 'LineString',
						coordinates: [[-80, -20], [-80, 180]]
					}
				},
				{
					id: 'connects:cable2',
					properties: { name: 'Floor 2-3 Link' },
					geometry: {
						type: 'LineString',
						coordinates: [[-80, 180], [80, 380]]
					}
				}
			]
		}
	];
}
