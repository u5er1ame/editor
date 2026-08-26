import type { StyleLike } from 'ol/style/Style';
import type { View as OlView } from 'ol';
import type { Tables } from '$lib/model/types';

export type MapTableName = Tables | 'zones';

export interface MapLayerConfig {
	/** Table name this layer represents */
	table: MapTableName;
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
	/** Initial center [x, y] */
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
	/** Editor configuration */
	editor?: MapEditorConfig;
}


export interface MapEditorConfig {
	/** Whether editing is enabled */
	enabled: boolean;
	/** Snap tolerance in pixels */
	snapTolerance: number;
	/** Default edit tool */
	defaultTool: 'select' | 'add-point' | 'remove-point' | 'extrude-edge' | 'split' | 'combine';
	/** Allow adding points */
	allowAddPoint: boolean;
	/** Allow removing points */
	allowRemovePoint: boolean;
	/** Allow edge extrude */
	allowExtrudeEdge: boolean;
	/** Allow split */
	allowSplit: boolean;
	/** Allow combine */
	allowCombine: boolean;
}

export class MapConfigBuilder {
	private _defaultEditorConfig: MapEditorConfig = {
		enabled: true,
		snapTolerance: 10,
		defaultTool: 'select',
		allowAddPoint: true,
		allowRemovePoint: true,
		allowExtrudeEdge: true,
		allowSplit: true,
		allowCombine: true
	};

	private _config: Partial<MapConfig> = {
		center: [0, 0],
		zoom: 15,
		minZoom: 0,
		maxZoom: 18,
		layers: []
	};

	constructor() {}

	get config() {
		return this._config;
	}

	center(x: number, y: number) {
		this._config.center = [x, y];
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

	removeLayer(table: MapTableName) {
		this._config.layers = this._config.layers!.filter((l) => l.table !== table);
		return this;
	}

	updateLayer(table: MapTableName, updates: Partial<MapLayerConfig>) {
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

	editor(config: Partial<MapEditorConfig>) {
		this._config.editor = { ...this._defaultEditorConfig, ...config };
		return this;
	}

	build(): MapConfig {
		if (!this._config.center) throw new Error('Config error: center not set');
		if (this._config.zoom === undefined) throw new Error('Config error: zoom not set');
		if (!this._config.layers) throw new Error('Config error: layers not set');
		return this.config as MapConfig;
	}

	static default() {
		return new MapConfigBuilder();
	}
}
