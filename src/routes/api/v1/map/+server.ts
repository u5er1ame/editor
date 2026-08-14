import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import type { MapTableData } from '$lib/view/map.svelte';

// Fake data scaled for EPSG:3857 (meters)
// At zoom 15, 1 pixel ≈ 5m, so 40km grid = 8000px

interface FakeFeature {
	id: string;
	name: string;
	geometry: {
		type: 'Point' | 'Polygon' | 'LineString';
		coordinates: number[] | number[][];
	};
}

const makeRect = (cx: number, cy: number, w: number, h: number): number[][] => {
	const hw = w / 2, hh = h / 2;
	return [[cx - hw, cy - hh], [cx + hw, cy - hh], [cx + hw, cy + hh], [cx - hw, cy + hh], [cx - hw, cy - hh]];
};

const fakeLocations: FakeFeature[] = [
	{ id: 'loc:1', name: 'Room A1', geometry: { type: 'Polygon', coordinates: [makeRect(-5000, -5000, 2000, 1500)] } },
	{ id: 'loc:2', name: 'Room A2', geometry: { type: 'Polygon', coordinates: [makeRect(5000, -5000, 2000, 1500)] } },
	{ id: 'loc:3', name: 'Room B1', geometry: { type: 'Polygon', coordinates: [makeRect(-5000, 5000, 2000, 1500)] } },
	{ id: 'loc:4', name: 'Room B2', geometry: { type: 'Polygon', coordinates: [makeRect(5000, 5000, 2000, 1500)] } },
	{ id: 'loc:5', name: 'Room C1', geometry: { type: 'Polygon', coordinates: [makeRect(0, 0, 2000, 1500)] } }
];

const fakeAreas: FakeFeature[] = [
	{ id: 'area:1', name: 'Zone 1', geometry: { type: 'Polygon', coordinates: [makeRect(-5000, -5000, 8000, 8000)] } },
	{ id: 'area:2', name: 'Zone 2', geometry: { type: 'Polygon', coordinates: [makeRect(5000, -5000, 8000, 8000)] } },
	{ id: 'area:3', name: 'Zone 3', geometry: { type: 'Polygon', coordinates: [makeRect(-5000, 5000, 8000, 8000)] } }
];

const fakeCables: FakeFeature[] = [
	{ id: 'cable:1', name: 'Main Feed', geometry: { type: 'LineString', coordinates: [[-15000, 0], [-5000, 0]] } },
	{ id: 'cable:2', name: 'Bus A', geometry: { type: 'LineString', coordinates: [[-5000, -5000], [5000, -5000]] } },
	{ id: 'cable:3', name: 'Bus B', geometry: { type: 'LineString', coordinates: [[-5000, -5000], [-5000, 5000]] } },
	{ id: 'cable:4', name: 'Cross Link', geometry: { type: 'LineString', coordinates: [[-5000, -5000], [5000, 5000]] } },
	{ id: 'cable:5', name: 'Branch', geometry: { type: 'LineString', coordinates: [[0, 0], [0, 10000]] } }
];

export const GET: RequestHandler = async ({ url }) => {
	const table = url.searchParams.get('table');

	const mapData: MapTableData[] = [];

	if (!table || table === 'locations') {
		mapData.push({
			table: 'levels',
			features: fakeLocations.map((f) => ({
				id: f.id,
				properties: { name: f.name },
				geometry: f.geometry
			}))
		});
	}

	if (!table || table === 'areas') {
		mapData.push({
			table: 'area_name',
			features: fakeAreas.map((f) => ({
				id: f.id,
				properties: { name: f.name },
				geometry: f.geometry
			}))
		});
	}

	if (!table || table === 'cables') {
		mapData.push({
			table: 'connects',
			features: fakeCables.map((f) => ({
				id: f.id,
				properties: { name: f.name },
				geometry: f.geometry
			}))
		});
	}

	return json(mapData);
};
