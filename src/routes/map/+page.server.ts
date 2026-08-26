import type { PageServerLoad } from './$types';
import { MapConfigBuilder } from '$lib/builders/map.config';

export const load: PageServerLoad = async ({ fetch }) => {
	const mapConfig = MapConfigBuilder.default()
		.center(0, 0)
		.zoom(0)
		.minZoom(0)
		.maxZoom(18)
		.addLayer({
			table: 'zones',
			geometryKey: 'geometry',
			idKey: 'id',
			labelKey: 'name',
			selectable: true,
			visible: true,
			zIndex: 1
		})
		.addLayer({
			table: 'connects',
			geometryKey: 'geometry',
			idKey: 'id',
			labelKey: 'name',
			selectable: true,
			visible: true,
			zIndex: 2
		})
		.addLayer({
			table: 'levels',
			geometryKey: 'geometry',
			idKey: 'id',
			labelKey: 'name',
			selectable: true,
			visible: true,
			zIndex: 3
		})
		.editor({
			enabled: true,
			snapTolerance: 10,
			defaultTool: 'select',
			allowAddPoint: true,
			allowRemovePoint: true,
			allowExtrudeEdge: true,
			allowSplit: true,
			allowCombine: true
		})
		.build();

	const [mapResponse, pointsResponse] = await Promise.all([
		fetch('/api/v1/map'),
		fetch('/api/v1/search-points')
	]);

	return {
		mapConfig,
		mapData: await mapResponse.json(),
		searchPoints: pointsResponse.ok ? await pointsResponse.json() : []
	};
};
