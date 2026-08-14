import type { PageLoad, PageServerData } from './$types';
import { MapConfigBuilder } from '$lib/builders/map.config';
import { Style, Fill, Stroke, Circle as CircleStyle } from 'ol/style';

export const load: PageLoad = async ({ data }: { data: PageServerData }) => {
	// Build map configuration
	const mapConfig = MapConfigBuilder.default()
		.projection('EPSG:3857')
		.center(21.0122, 52.2297) // Warsaw
		.zoom(13)
		.minZoom(1)
		.maxZoom(19)
		.addLayer({
			table: 'area_name',
			geometryKey: 'geometry',
			idKey: 'id',
			labelKey: 'name',
			style: new Style({
				stroke: new Stroke({
					color: 'rgba(59, 130, 246, 0.8)',
					width: 2
				}),
				fill: new Fill({
					color: 'rgba(59, 130, 246, 0.15)'
				})
			}),
			selectable: true,
			visible: true,
			zIndex: 1
		})
		.addLayer({
			table: 'connects',
			geometryKey: 'geometry',
			idKey: 'id',
			labelKey: 'name',
			style: new Style({
				stroke: new Stroke({
					color: 'rgba(34, 197, 94, 0.9)',
					width: 3
				})
			}),
			selectable: true,
			visible: true,
			zIndex: 2
		})
		.addLayer({
			table: 'levels',
			geometryKey: 'geometry',
			idKey: 'id',
			labelKey: 'name',
			style: new Style({
				image: new CircleStyle({
					radius: 8,
					fill: new Fill({ color: 'rgba(239, 68, 68, 0.7)' }),
					stroke: new Stroke({ color: '#ef4444', width: 2 })
				})
			}),
			selectable: true,
			visible: true,
			zIndex: 3
		})
		.build();

	return {
		...data,
		mapConfig
	};
};
