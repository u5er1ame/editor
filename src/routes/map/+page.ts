import type { PageLoad, PageServerData } from './$types';
import { MapConfigBuilder } from '$lib/builders/map.config';

export const load: PageLoad = async ({ data }: { data: PageServerData }) => {
	// Build map configuration - simple Cartesian coordinates, no projection
	const mapConfig = MapConfigBuilder.default()
		.center(0, 0)
		.zoom(0)
		.minZoom(0)
		.maxZoom(18)
		.addLayer({
			table: 'area_name',
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

	return {
		...data,
		mapConfig
	};
};
