import Map from 'ol/Map';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import Select from 'ol/interaction/Select';
import Modify from 'ol/interaction/Modify';
import Snap from 'ol/interaction/Snap';
import { singleClick } from 'ol/events/condition';
import { Style, Fill, Stroke, Circle as CircleStyle } from 'ol/style';
import type Feature from 'ol/Feature';
import type { Geometry, Polygon, MultiPolygon } from 'ol/geom';
import type { Coordinate } from 'ol/coordinate';
import * as turf from '@turf/turf';

export type EditTool = 'select' | 'add-point' | 'remove-point' | 'extrude-edge' | 'split' | 'combine';

export interface EditCallbacks {
	onFeatureSelect?: (feature: Feature<Geometry> | null) => void;
	onFeatureModified?: (feature: Feature<Geometry>) => void;
	onToolChange?: (tool: EditTool) => void;
	onSaveRequired?: (hasChanges: boolean) => void;
}

const editedStyle = new Style({
	image: new CircleStyle({
		radius: 8,
		fill: new Fill({ color: 'rgba(234, 179, 8, 0.7)' }),
		stroke: new Stroke({ color: '#eab308', width: 2 })
	}),
	stroke: new Stroke({ color: '#eab308', width: 3 }),
	fill: new Fill({ color: 'rgba(234, 179, 8, 0.2)' })
});

const selectedStyle = new Style({
	image: new CircleStyle({
		radius: 10,
		fill: new Fill({ color: 'rgba(59, 130, 246, 0.7)' }),
		stroke: new Stroke({ color: '#3b82f6', width: 3 })
	}),
	stroke: new Stroke({ color: '#3b82f6', width: 4 }),
	fill: new Fill({ color: 'rgba(59, 130, 246, 0.2)' })
});

export class GeometryEditor {
	private map: Map;
	private vectorLayers: VectorLayer<VectorSource>[];
	private callbacks: EditCallbacks;

	private selectInteraction: Select | null = null;
	private modifyInteraction: Modify | null = null;
	private snapInteraction: Snap | null = null;

	activeTool: EditTool = 'select';
	snapEnabled = true;
	selectedFeature: Feature<Geometry> | null = null;
	editedFeatures = new Set<string>();
	hasChanges = false;

	private selectedEdge: [Coordinate, Coordinate] | null = null;
	splitPoints: Coordinate[] = [];

	constructor(
		map: Map,
		vectorLayers: VectorLayer<VectorSource>[],
		callbacks: EditCallbacks = {}
	) {
		this.map = map;
		this.vectorLayers = vectorLayers;
		this.callbacks = callbacks;
		this.initInteractions();
	}

	private initInteractions() {
		this.selectInteraction = new Select({
			condition: singleClick,
			layers: this.vectorLayers,
			style: (feature) => {
				return this.editedFeatures.has(feature.getId()?.toString() ?? '')
					? editedStyle
					: selectedStyle;
			}
		});

		this.selectInteraction.on('select', (event) => {
			const selected = event.selected[0] ?? null;
			this.selectedFeature = selected;
			this.callbacks.onFeatureSelect?.(selected);

			if (this.activeTool === 'extrude-edge' && selected) {
				this.clearEdgeSelection();
			}
		});

		this.map.addInteraction(this.selectInteraction);

		this.modifyInteraction = new Modify({
			features: this.selectInteraction.getFeatures(),
			deleteCondition: (event) => event.type === 'dblclick'
		});

		this.modifyInteraction.on('modifyend', (event) => {
			event.features.forEach((f) => this.markAsEdited(f));
		});

		this.map.addInteraction(this.modifyInteraction);

		this.snapInteraction = new Snap({
			features: this.getAllFeatures(),
			pixelTolerance: 10,
			vertex: true,
			edge: true
		});

		this.map.addInteraction(this.snapInteraction);

		this.map.on('click', (event) => {
			if (this.activeTool === 'extrude-edge') {
				this.handleEdgeClick(event);
			} else if (this.activeTool === 'split') {
				this.handleSplitClick(event);
			}
		});

		this.map.on('pointermove', (event) => {
			if (this.activeTool === 'extrude-edge' && this.selectedEdge) {
				this.handleEdgeDrag(event);
			}
		});
	}

	private getAllFeatures(): Feature[] {
		const features: Feature[] = [];
		for (const layer of this.vectorLayers) {
			const source = layer.getSource();
			if (source) features.push(...source.getFeatures());
		}
		return features;
	}

	setTool(tool: EditTool) {
		if (this.activeTool === 'extrude-edge') this.clearEdgeSelection();
		if (this.activeTool === 'split') this.splitPoints = [];

		this.activeTool = tool;

		if (this.selectInteraction) {
			this.selectInteraction.setActive(tool === 'select' || tool === 'extrude-edge' || tool === 'combine');
		}
		if (this.modifyInteraction) {
			this.modifyInteraction.setActive(tool === 'add-point' || tool === 'remove-point');
		}

		this.callbacks.onToolChange?.(tool);
	}

	toggleSnap() {
		this.snapEnabled = !this.snapEnabled;
		if (this.snapInteraction) {
			this.snapInteraction.setActive(this.snapEnabled);
		}
	}

	private markAsEdited(feature: Feature) {
		const id = feature.getId()?.toString();
		if (id) {
			this.editedFeatures.add(id);
			feature.setStyle(editedStyle);
			this.hasChanges = true;
			this.callbacks.onFeatureModified?.(feature);
			this.callbacks.onSaveRequired?.(true);
		}
	}

	resetEdits() {
		for (const feature of this.getAllFeatures()) {
			const id = feature.getId()?.toString();
			if (id && this.editedFeatures.has(id)) {
				feature.setStyle(undefined);
			}
		}
		this.editedFeatures.clear();
		this.hasChanges = false;
		this.callbacks.onSaveRequired?.(false);
	}

	getEditedFeatures(): Feature[] {
		return this.getAllFeatures().filter((f) =>
			this.editedFeatures.has(f.getId()?.toString() ?? '')
		);
	}

	clearSelection() {
		if (this.selectInteraction) {
			this.selectInteraction.getFeatures().clear();
		}
		this.selectedFeature = null;
		this.clearEdgeSelection();
	}

	private handleEdgeClick(event: any) {
		if (!this.selectedFeature) return;

		const coordinate = this.map.getCoordinateFromPixel(event.pixel);
		const geom = this.selectedFeature.getGeometry();

		if (geom && 'getCoordinates' in geom) {
			const coords = (geom as Polygon).getCoordinates()[0];
			if (!coords) return;

			let minDist = Infinity;
			let edge: [Coordinate, Coordinate] | null = null;

			for (let i = 0; i < coords.length - 1; i++) {
				const dist = this.pointToLineDistance(coordinate, coords[i], coords[i + 1]);
				if (dist < minDist && dist < this.map.getView().getResolution()! * 20) {
					minDist = dist;
					edge = [coords[i], coords[i + 1]];
				}
			}

			if (edge) {
				this.selectedEdge = edge;
			}
		}
	}

	private handleEdgeDrag(event: any) {
		if (!this.selectedEdge || !this.selectedFeature) return;

		const coordinate = this.map.getCoordinateFromPixel(event.pixel);
		const geom = this.selectedFeature.getGeometry() as Polygon;
		if (!geom) return;

		const coords = geom.getCoordinates()[0];
		if (!coords) return;

		const [p1, p2] = this.selectedEdge;
		const midX = (p1[0] + p2[0]) / 2;
		const midY = (p1[1] + p2[1]) / 2;

		const dx = p2[0] - p1[0];
		const dy = p2[1] - p1[1];
		const len = Math.sqrt(dx * dx + dy * dy);
		if (len === 0) return;

		const nx = -dy / len;
		const ny = dx / len;

		const dmx = coordinate[0] - midX;
		const dmy = coordinate[1] - midY;
		const projection = dmx * nx + dmy * ny;

		const newCoords = coords.map((c) => {
			if (c[0] === p1[0] && c[1] === p1[1]) {
				return [c[0] + nx * projection, c[1] + ny * projection];
			}
			if (c[0] === p2[0] && c[1] === p2[1]) {
				return [c[0] + nx * projection, c[1] + ny * projection];
			}
			return c;
		});

		geom.setCoordinates([newCoords]);
		this.markAsEdited(this.selectedFeature);
	}

	private clearEdgeSelection() {
		this.selectedEdge = null;
	}

	private handleSplitClick(event: any) {
		const coordinate = this.map.getCoordinateFromPixel(event.pixel);
		this.splitPoints.push(coordinate);

		if (this.splitPoints.length >= 2) {
			if (this.selectedFeature) {
				this.splitPolygon(this.selectedFeature, this.splitPoints);
			}
			this.splitPoints = [];
		}
	}

	splitPolygon(feature: Feature<Geometry>, linePoints: Coordinate[]) {
		const geom = feature.getGeometry() as Polygon;
		if (!geom) return;

		const coords = geom.getCoordinates()[0];
		if (!coords) return;

		const line = turf.lineString(linePoints);
		const polyGeoJson = {
			type: 'Feature' as const,
			geometry: { type: 'Polygon' as const, coordinates: [coords] }
		};

		try {
			const split = turf.lineSplit(polyGeoJson as any, line as any);
			if (split && split.features.length > 1) {
				const source = this.vectorLayers[0]?.getSource();
				if (source) {
					source.removeFeature(feature);
					for (const f of split.features) {
						const newFeature = new Feature({
							geometry: new Polygon((f.geometry as any).coordinates)
						});
						newFeature.setId('split_' + Math.random().toString(36).substr(2, 9));
						source.addFeature(newFeature);
						this.markAsEdited(newFeature);
					}
				}
			}
		} catch (e) {
			console.error('Split failed:', e);
		}
	}

	combinePolygons(feature1: Feature<Geometry>, feature2: Feature<Geometry>): boolean {
		const geom1 = feature1.getGeometry() as Polygon | MultiPolygon;
		const geom2 = feature2.getGeometry() as Polygon | MultiPolygon;
		if (!geom1 || !geom2) return false;

		const toPoly = (g: Polygon | MultiPolygon) => ({
			type: 'Feature' as const,
			geometry: {
				type: 'Polygon' as const,
				coordinates: g.getType() === 'MultiPolygon'
					? (g as MultiPolygon).getCoordinates()[0]
					: (g as Polygon).getCoordinates()
			}
		});

		try {
			const union = turf.union(toPoly(geom1) as any, toPoly(geom2) as any);
			if (union) {
				const source = this.vectorLayers[0]?.getSource();
				if (source) {
					source.removeFeature(feature1);
					source.removeFeature(feature2);
					const newFeature = new Feature({
						geometry: new Polygon((union.geometry as any).coordinates)
					});
					newFeature.setId('merged_' + Math.random().toString(36).substr(2, 9));
					source.addFeature(newFeature);
					this.markAsEdited(newFeature);
					return true;
				}
			}
		} catch (e) {
			console.error('Combine failed:', e);
		}
		return false;
	}

	private pointToLineDistance(point: Coordinate, lineStart: Coordinate, lineEnd: Coordinate): number {
		const [x, y] = point;
		const [x1, y1] = lineStart;
		const [x2, y2] = lineEnd;

		const A = x - x1;
		const B = y - y1;
		const C = x2 - x1;
		const D = y2 - y1;

		const dot = A * C + B * D;
		const lenSq = C * C + D * D;
		let param = lenSq !== 0 ? dot / lenSq : -1;

		if (param < 0) param = 0;
		else if (param > 1) param = 1;

		const xx = x1 + param * C;
		const yy = y1 + param * D;
		return Math.sqrt((x - xx) ** 2 + (y - yy) ** 2);
	}

	destroy() {
		if (this.selectInteraction) this.map.removeInteraction(this.selectInteraction);
		if (this.modifyInteraction) this.map.removeInteraction(this.modifyInteraction);
		if (this.snapInteraction) this.map.removeInteraction(this.snapInteraction);
	}
}
