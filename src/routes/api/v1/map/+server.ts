import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import type { MapTableData } from '$lib/view/map.svelte';

// Fake data that mimics SurrealDB schemas with geometry fields added
// These would normally come from tables marked for map purpose

interface FakeLocation {
	id: string;
	name: string;
	level: string;
	area_name: string;
	geometry: {
		type: 'Point' | 'Polygon' | 'LineString';
		coordinates: number[] | number[][];
	};
}

const fakeLocations: FakeLocation[] = [
	// Electric rooms as points
	{
		id: 'locations:er1',
		name: 'Main Electrical Room',
		level: 'levels:level1',
		area_name: 'area_name:area1',
		geometry: { type: 'Point', coordinates: [21.0122, 52.2297] }
	},
	{
		id: 'locations:er2',
		name: 'North Electrical Room',
		level: 'levels:level1',
		area_name: 'area_name:area2',
		geometry: { type: 'Point', coordinates: [21.0142, 52.2317] }
	},
	{
		id: 'locations:er3',
		name: 'South Electrical Room',
		level: 'levels:level2',
		area_name: 'area_name:area1',
		geometry: { type: 'Point', coordinates: [21.0102, 52.2277] }
	},
	{
		id: 'locations:er4',
		name: 'East Electrical Room',
		level: 'levels:level2',
		area_name: 'area_name:area3',
		geometry: { type: 'Point', coordinates: [21.0162, 52.2297] }
	},
	{
		id: 'locations:er5',
		name: 'West Electrical Room',
		level: 'levels:level1',
		area_name: 'area_name:area4',
		geometry: { type: 'Point', coordinates: [21.0082, 52.2297] }
	}
];

const fakeAreas: FakeLocation[] = [
	// Areas as polygons
	{
		id: 'areas:a1',
		name: 'Zone A - Main',
		level: 'levels:level1',
		area_name: 'area_name:area1',
		geometry: {
			type: 'Polygon',
			coordinates: [
				[
					[21.0102, 52.2287],
					[21.0142, 52.2287],
					[21.0142, 52.2307],
					[21.0102, 52.2307],
					[21.0102, 52.2287]
				]
			]
		}
	},
	{
		id: 'areas:a2',
		name: 'Zone B - North',
		level: 'levels:level1',
		area_name: 'area_name:area2',
		geometry: {
			type: 'Polygon',
			coordinates: [
				[
					[21.0122, 52.2307],
					[21.0162, 52.2307],
					[21.0162, 52.2327],
					[21.0122, 52.2327],
					[21.0122, 52.2307]
				]
			]
		}
	},
	{
		id: 'areas:a3',
		name: 'Zone C - South',
		level: 'levels:level2',
		area_name: 'area_name:area3',
		geometry: {
			type: 'Polygon',
			coordinates: [
				[
					[21.0082, 52.2267],
					[21.0122, 52.2267],
					[21.0122, 52.2287],
					[21.0082, 52.2287],
					[21.0082, 52.2267]
				]
			]
		}
	}
];

const fakeCables: FakeLocation[] = [
	// Cables as lines
	{
		id: 'cables:c1',
		name: 'Main Power Line',
		level: 'levels:level1',
		area_name: 'area_name:area1',
		geometry: {
			type: 'LineString',
			coordinates: [
				[21.0102, 52.2297],
				[21.0122, 52.2297]
			]
		}
	},
	{
		id: 'cables:c2',
		name: 'North Distribution',
		level: 'levels:level1',
		area_name: 'area_name:area2',
		geometry: {
			type: 'LineString',
			coordinates: [
				[21.0122, 52.2297],
				[21.0142, 52.2317]
			]
		}
	},
	{
		id: 'cables:c3',
		name: 'South Distribution',
		level: 'levels:level2',
		area_name: 'area_name:area1',
		geometry: {
			type: 'LineString',
			coordinates: [
				[21.0122, 52.2297],
				[21.0102, 52.2277]
			]
		}
	},
	{
		id: 'cables:c4',
		name: 'East Line',
		level: 'levels:level2',
		area_name: 'area_name:area3',
		geometry: {
			type: 'LineString',
			coordinates: [
				[21.0142, 52.2297],
				[21.0162, 52.2297]
			]
		}
	},
	{
		id: 'cables:c5',
		name: 'West Line',
		level: 'levels:level1',
		area_name: 'area_name:area4',
		geometry: {
			type: 'LineString',
			coordinates: [
				[21.0102, 52.2297],
				[21.0082, 52.2297]
			]
		}
	}
];

export const GET: RequestHandler = async ({ url }) => {
	const table = url.searchParams.get('table');

	const mapData: MapTableData[] = [];

	if (!table || table === 'locations') {
		mapData.push({ table: 'levels', features: fakeLocations.map(f => ({
			id: f.id,
			properties: { name: f.name, level: f.level, area_name: f.area_name },
			geometry: f.geometry
		})) });
	}

	if (!table || table === 'areas') {
		mapData.push({ table: 'area_name', features: fakeAreas.map(f => ({
			id: f.id,
			properties: { name: f.name, level: f.level, area_name: f.area_name },
			geometry: f.geometry
		})) });
	}

	if (!table || table === 'cables') {
		mapData.push({ table: 'connects', features: fakeCables.map(f => ({
			id: f.id,
			properties: { name: f.name, level: f.level, area_name: f.area_name },
			geometry: f.geometry
		})) });
	}

	return json(mapData);
};
