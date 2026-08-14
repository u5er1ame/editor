import GeoJSON from 'ol/format/GeoJSON';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import { Style, Fill, Stroke, Circle as CircleStyle, Text } from 'ol/style';
import type Feature from 'ol/Feature';
import type { Geometry } from 'ol/geom';
import type { MapLayerConfig, MapConfig } from '$lib/builders/map.config';
import type { Tables } from '$lib/model/types';

export interface MapFeatureData {
	/** Feature ID */
	id: string;
	/** Feature properties */
	properties: Record<string, any>;
	/** GeoJSON geometry */
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
	 * Convert server data to MapFeatureData
	 * Expects data with a geometry field containing GeoJSON geometry
	 */
	static toFeature(
		item: Record<string, any>,
		config: MapLayerConfig
	): MapFeatureData | null {
		const geometry = item[config.geometryKey];
		if (!geometry) return null;

		const id = config.idKey ? String(item[config.idKey]) : item.id?.toString();
		if (!id) return null;

		const properties: Record<string, any> = { ...item };
		delete properties[config.geometryKey];

		return {
			id,
			properties,
			geometry: geometry
		};
	}

	/**
	 * Create an OpenLayers VectorLayer from table data
	 */
	static createLayer(
		data: MapFeatureData[],
		config: MapLayerConfig,
		mapConfig: MapConfig
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
				featureProjection: mapConfig.projection
			})
		});

		const layer = new VectorLayer({
			source,
			style: config.style ?? MapViewController.getDefaultStyle(config),
			visible: config.visible !== false,
			zIndex: config.zIndex ?? 0
		});

		return layer;
	}

	/**
	 * Get default style based on layer configuration
	 */
	static getDefaultStyle(config: MapLayerConfig): Style {
		return new Style({
			image: new CircleStyle({
				radius: 8,
				fill: new Fill({ color: 'rgba(59, 130, 246, 0.6)' }),
				stroke: new Stroke({ color: '#3b82f6', width: 2 })
			}),
			stroke: new Stroke({
				color: 'rgba(59, 130, 246, 0.8)',
				width: 2
			}),
			fill: new Fill({
				color: 'rgba(59, 130, 246, 0.2)'
			}),
			text: config.labelKey
				? new Text({
						text: '{' + config.labelKey + '}',
						font: '12px sans-serif',
						fill: new Fill({ color: '#000' }),
						stroke: new Stroke({ color: '#fff', width: 3 })
					})
				: undefined
		});
	}

	/**
	 * Create a selected style for features
	 */
	static getSelectedStyle(): Style {
		return new Style({
			image: new CircleStyle({
				radius: 10,
				fill: new Fill({ color: 'rgba(234, 179, 8, 0.6)' }),
				stroke: new Stroke({ color: '#eab308', width: 3 })
			}),
			stroke: new Stroke({
				color: 'rgba(234, 179, 8, 0.9)',
				width: 4
			}),
			fill: new Fill({
				color: 'rgba(234, 179, 8, 0.3)'
			})
		});
	}

	/**
	 * Create a hover style for features
	 */
	static getHoverStyle(): Style {
		return new Style({
			image: new CircleStyle({
				radius: 9,
				fill: new Fill({ color: 'rgba(16, 185, 129, 0.6)' }),
				stroke: new Stroke({ color: '#10b981', width: 2 })
			}),
			stroke: new Stroke({
				color: 'rgba(16, 185, 129, 0.8)',
				width: 3
			}),
			fill: new Fill({
				color: 'rgba(16, 185, 129, 0.2)'
			})
		});
	}

	/**
	 * Get feature at pixel coordinates
	 */
	static getFeatureAtPixel(
		pixel: [number, number],
		layers: VectorLayer<VectorSource<Feature<Geometry>>>[],
		map: any
	): Feature<Geometry> | null {
		const feature = map.forEachFeatureAtPixel(pixel, (f: Feature<Geometry>) => f, {
			layerFilter: (layer: any) => layers.includes(layer)
		});
		return feature ?? null;
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
