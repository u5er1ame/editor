import type { StyleLike } from 'ol/style/Style';
import type { View as OlView } from 'ol';
import type { Tables } from '$lib/model/types';

export interface MapLayerConfig {
	/** Table name this layer represents */
	table: Tables;
	/** Geometry field name in the data */
	geometryKey: string;
	/** Field to use as feature id */
	idKey?: string;
	/** Field to use as feature label */
	labelKey?: string;
	/** OpenLayers style for features */
	style?: StyleLike;
	/** Whether this layer is selectable */
	selectable?: boolean;
	/** Whether this layer is visible by default */
	visible?: boolean;
	/** Z-index for layer ordering */
	zIndex?: number;
	/** Max zoom level to show this layer */
	maxZoom?: number;
	/** Min zoom level to show this layer */
	minZoom?: number;
}

export interface MapConfig {
	/** Base projection */
	projection: string;
	/** Initial center [lon, lat] */
	center: [number, number];
	/** Initial zoom level */
	zoom: number;
	/** Min zoom */
	minZoom: number;
	/** Max zoom */
	maxZoom: number;
	/** Layer configurations */
	layers: MapLayerConfig[];
	/** OpenLayers view options */
	viewOptions?: Partial<OlView>;
}

export class MapConfigBuilder {
	private _config: Partial<MapConfig> = {
		projection: 'EPSG:3857',
		center: [21.0122, 52.2297], // Warsaw, Poland (matching likely DB location)
		zoom: 12,
		minZoom: 1,
		maxZoom: 19,
		layers: []
	};

	constructor() {}

	get config() {
		return this._config;
	}

	projection(proj: string) {
		this._config.projection = proj;
		return this;
	}

	center(lon: number, lat: number) {
		this._config.center = [lon, lat];
		return this;
	}

	zoom(z: number) {
		this._config.zoom = z;
		return this;
	}

	minZoom(z: number) {
		this._config.minZoom = z;
		return this;
	}

	maxZoom(z: number) {
		this._config.maxZoom = z;
		return this;
	}

	addLayer(layer: MapLayerConfig) {
		this._config.layers!.push(layer);
		return this;
	}

	removeLayer(table: Tables) {
		this._config.layers = this._config.layers!.filter((l) => l.table !== table);
		return this;
	}

	updateLayer(table: Tables, updates: Partial<MapLayerConfig>) {
		const idx = this._config.layers!.findIndex((l) => l.table === table);
		if (idx !== -1) {
			this._config.layers![idx] = { ...this._config.layers![idx], ...updates };
		}
		return this;
	}

	viewOptions(opts: Partial<OlView>) {
		this._config.viewOptions = opts;
		return this;
	}

	build(): MapConfig {
		if (!this._config.projection) throw new Error('Config error: projection not set');
		if (!this._config.center) throw new Error('Config error: center not set');
		if (this._config.zoom === undefined) throw new Error('Config error: zoom not set');
		if (!this._config.layers) throw new Error('Config error: layers not set');
		return this.config as MapConfig;
	}

	static default() {
		return new MapConfigBuilder();
	}
}
