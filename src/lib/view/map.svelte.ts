import GeoJSON from 'ol/format/GeoJSON';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import type Feature from 'ol/Feature';
import type { Geometry } from 'ol/geom';
import type { MapLayerConfig } from '$lib/builders/map.config';
import type { Tables } from '$lib/model/types';
import { MALL_LOCAL_PROJECTION } from '$lib/view/map/projection';


export interface MapFeatureData {
	id: string;
	properties: Record<string, any>;
	geometry: {
		type: string;
		coordinates: number[] | number[][];
	};
}

export interface MapTableData {
	table: Tables;
	features: MapFeatureData[];
}

export class MapViewController {
	/**
	 * Create an OpenLayers VectorLayer from feature data
	 */
	static createLayer(
		data: MapFeatureData[],
		config: MapLayerConfig
	): VectorLayer<VectorSource<Feature<Geometry>>> {
		const format = new GeoJSON();

		const geoJsonData = {
			type: 'FeatureCollection',
			features: data.map((f) => ({
				type: 'Feature',
				id: f.id,
				geometry: f.geometry,
				properties: f.properties
			}))
		};

		const source = new VectorSource({
			features: format.readFeatures(geoJsonData, {
				dataProjection: MALL_LOCAL_PROJECTION,
				featureProjection: MALL_LOCAL_PROJECTION
			})
		});

		return new VectorLayer({
			source,
			visible: config.visible !== false,
			zIndex: config.zIndex ?? 0
		});
	}

	/**
	 * Get feature properties
	 */
	static getFeatureProperties(feature: Feature<Geometry>): Record<string, any> {
		return feature.getProperties() as Record<string, any>;
	}

	/**
	 * Get feature ID
	 */
	static getFeatureId(feature: Feature<Geometry>): string | undefined {
		return feature.getId()?.toString();
	}
}
