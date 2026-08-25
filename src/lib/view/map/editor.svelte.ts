import Map from 'ol/Map';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import Select from 'ol/interaction/Select';
import Modify from 'ol/interaction/Modify';
import Snap from 'ol/interaction/Snap';
import { singleClick } from 'ol/events/condition';
import { Style, Fill, Stroke, Circle as CircleStyle } from 'ol/style';
import { Point, LineString, Polygon } from 'ol/geom';
import Collection from 'ol/Collection';
import Feature from 'ol/Feature';
import type { Geometry } from 'ol/geom';
import type { Coordinate } from 'ol/coordinate';
import * as turf from '@turf/turf';
// @ts-ignore - lineSplit exists at runtime but not in type defs
const turfLineSplit = turf.lineSplit;

export type EditMode = 'select' | 'move' | 'point-edit' | 'extrude' | 'split';

export type EditorCallbacks = {
	onSelect?: (feature: Feature<Geometry> | null) => void;
};

const selectedStyle = new Style({
	image: new CircleStyle({
		radius: 10,
		fill: new Fill({ color: 'rgba(59, 130, 246, 0.7)' }),
		stroke: new Stroke({ color: '#3b82f6', width: 3 })
	}),
	stroke: new Stroke({ color: '#3b82f6', width: 4 }),
	fill: new Fill({ color: 'rgba(59, 130, 246, 0.15)' })
});

const editedStyle = new Style({
	image: new CircleStyle({
		radius: 8,
		fill: new Fill({ color: 'rgba(234, 179, 8, 0.7)' }),
		stroke: new Stroke({ color: '#eab308', width: 2 })
	}),
	stroke: new Stroke({ color: '#eab308', width: 3 }),
	fill: new Fill({ color: 'rgba(234, 179, 8, 0.2)' })
});

export class GeometryEditor {
	private map: Map;
	private vectorLayers: VectorLayer<VectorSource>[];

	private callbacks: EditorCallbacks;

	private selectInteraction: Select;
	private modifyInteraction: Modify;
	private snapInteraction: Snap;

	// Point-edit vertex overlay
	private vertexSource: VectorSource;
	private vertexLayer: VectorLayer<VectorSource>;
	private vertexModify: Modify;

	// ── Extrude state
	private extrudeEdge: [Coordinate, Coordinate] | null = null;
	private extrudeStartPoint: Coordinate | null = null;

	// Split state
	private splitPoints: Coordinate[] = [];
	private splitLineSource: VectorSource;
	private splitLineLayer: VectorLayer<VectorSource>;

	mode: EditMode = $state('select');
	snapEnabled = $state(true);
	selectedFeature: Feature<Geometry> | null = $state(null);
	editedFeatures = new Set<string>();
	hasChanges: boolean = $state(false);

	// External state for split preview
	splitPreviewCoords: Coordinate[] = [];

	constructor(
		map: Map,
		vectorLayers: VectorLayer<VectorSource>[],
		callbacks: EditorCallbacks = {}
	) {
		this.map = map;
		this.vectorLayers = vectorLayers;
		this.callbacks = callbacks;
		// ── Select ──────────────────────────────────────────────────
		this.selectInteraction = new Select({
			condition: singleClick,
			layers: this.vectorLayers,
			style: (f) =>
				this.editedFeatures.has(f.getId()?.toString() ?? '') ? editedStyle : selectedStyle
		});
		this.selectInteraction.on('select', (event) => {
			const selected = event.selected[0] ?? null;
			this.selectedFeature = selected;
			this.callbacks.onSelect?.(selected);

			// Sync vertex overlay when selection changes in point-edit mode
			if (this.mode === 'point-edit') {
				this.syncVertexOverlay();
			}
			// Clear extrude state when selection changes
			if (this.mode === 'extrude') {
				this.clearExtrude();
			}
		});
		this.map.addInteraction(this.selectInteraction);

		// ── Modify (used in move) ──────────────────────────────
		this.modifyInteraction = new Modify({
			features: this.selectInteraction?.getFeatures() ?? new Collection([]),
			deleteCondition: () => false,
			insertVertexCondition: () => false
		});
		this.modifyInteraction.on('modifyend', (event) => {
			event.features.forEach((f) => this.markAsEdited(f));
		});
		// Start inactive — setMode activates it
		this.modifyInteraction.setActive(false);
		this.map.addInteraction(this.modifyInteraction);

		// ── Snap ────────────────────────────────────────────────────
		this.snapInteraction = new Snap({
			features: new Collection(this.getAllFeatures()),
			pixelTolerance: 10,
			vertex: true,
			edge: true
		});
		this.map.addInteraction(this.snapInteraction);

		// ── Vertex overlay (for point-edit mode) ────────────────────
		this.vertexSource = new VectorSource();
		this.vertexLayer = new VectorLayer({
			source: this.vertexSource,
			zIndex: 1000,
			style: new Style({
				image: new CircleStyle({
					radius: 6,
					fill: new Fill({ color: 'rgba(16, 185, 129, 0.9)' }),
					stroke: new Stroke({ color: '#059669', width: 2 })
				})
			})
		});
		this.map.addLayer(this.vertexLayer);

		this.vertexModify = new Modify({
			features: this.vertexLayer.getSource()!.getFeaturesCollection()! ?? new Collection([]),
			deleteCondition: () => false
		});
		this.vertexModify.on('modifyend', (event) => {
			// Vertex was dragged — update the parent geometry
			event.features.forEach((vf) => {
				const parentGeom = vf.get('parentGeom') as Polygon | undefined;
				const idx = vf.get('vertexIndex') as number;
				if (!parentGeom || idx === undefined) return;

				const coords = parentGeom.getCoordinates()[0];
				const newCoord = (vf.getGeometry() as Point).getCoordinates();
				coords[idx] = newCoord;
				parentGeom.setCoordinates([coords]);
				this.markAsEdited(this.selectedFeature!);
			});
		});
		this.vertexModify.setActive(false);
		this.map.addInteraction(this.vertexModify);

		// ── Split line overlay ──────────────────────────────────────
		this.splitLineSource = new VectorSource();
		this.splitLineLayer = new VectorLayer({
			source: this.splitLineSource,
			zIndex: 999,
			style: new Style({
				stroke: new Stroke({ color: '#ef4444', width: 2, lineDash: [6, 4] })
			})
		});
		this.map.addLayer(this.splitLineLayer);

		// ── Map click handler for extrude/split ─────────────────────
		this.map.on('click', (event) => {
			if (this.mode === 'extrude') this.handleExtrudeClick(event);
			else if (this.mode === 'split') this.handleSplitClick(event);
		});

		// ── Map pointermove for extrude drag ────────────────────────
		this.map.on('pointermove', (event) => {
			if (this.mode === 'extrude' && this.extrudeEdge) {
				this.handleExtrudeDrag(event);
			}
		});
	}

	// ── Mode switching ────────────────────────────────────────────────

	setMode(mode: EditMode) {
		const prev = this.mode;
		this.mode = mode;

		// Cleanup previous mode
		if (prev === 'point-edit') this.clearVertexOverlay();
		if (prev === 'extrude') this.clearExtrude();
		if (prev === 'split') this.clearSplit();

		// Configure interactions for new mode
		switch (mode) {
			case 'select':
				this.selectInteraction.setActive(true);
				this.modifyInteraction.setActive(false);
				this.vertexModify.setActive(false);
				this.map.getTargetElement().style.cursor = '';
				break;

			case 'move':
				this.selectInteraction.setActive(true);
				this.modifyInteraction.setActive(true);
				this.vertexModify.setActive(false);
				this.map.getTargetElement().style.cursor = 'grab';
				break;

			case 'point-edit':
				this.selectInteraction.setActive(true);
				this.modifyInteraction.setActive(false);
				this.vertexModify.setActive(true);
				this.syncVertexOverlay();
				this.map.getTargetElement().style.cursor = 'crosshair';
				break;

			case 'extrude':
				this.selectInteraction.setActive(true);
				this.modifyInteraction.setActive(false);
				this.vertexModify.setActive(false);
				this.map.getTargetElement().style.cursor = 'crosshair';
				break;

			case 'split':
				this.selectInteraction.setActive(true);
				this.modifyInteraction.setActive(false);
				this.vertexModify.setActive(false);
				this.map.getTargetElement().style.cursor = 'crosshair';
				break;
		}
	}

	// ── Vertex overlay (point-edit mode) ──────────────────────────────

	syncVertexOverlay() {
		this.vertexSource.clear();

		if (!this.selectedFeature) return;
		const geom = this.selectedFeature.getGeometry();
		if (!geom || geom.getType() !== 'Polygon') return;

		const coords = (geom as Polygon).getCoordinates()[0];
		for (let i = 0; i < coords.length - 1; i++) {
			const vertexFeature = new Feature(new Point(coords[i]));
			vertexFeature.set('parentGeom', geom);
			vertexFeature.set('vertexIndex', i);
			this.vertexSource.addFeature(vertexFeature);
		}
	}

	private clearVertexOverlay() {
		this.vertexSource.clear();
	}

	// ── Extrude mode ──────────────────────────────────────────────────

	private findNearestEdge(
		coord: Coordinate,
		polygon: Polygon
	): { edge: [Coordinate, Coordinate]; index: number } | null {
		const rings = polygon.getCoordinates();
		if (!rings.length) return null;

		const coords = rings[0];
		if (!coords || coords.length < 3) return null;

		let minDist = Infinity;
		let best: { edge: [Coordinate, Coordinate]; index: number } | null = null;
		const threshold = this.map.getView().getResolution()! * 15;

		for (let i = 0; i < coords.length - 1; i++) {
			const dist = this.pointToLineDistance(coord, coords[i], coords[i + 1]);
			if (dist < minDist && dist < threshold) {
				minDist = dist;
				best = { edge: [coords[i], coords[i + 1]], index: i };
			}
		}

		return best;
	}

	private handleExtrudeClick(event: any) {
		if (!this.selectedFeature) return;
		const geom = this.selectedFeature.getGeometry();
		if (!geom || geom.getType() !== 'Polygon') return;

		const coord = this.map.getCoordinateFromPixel(event.pixel);
		const found = this.findNearestEdge(coord, geom as Polygon);

		if (found) {
			this.extrudeEdge = found.edge;
			this.extrudeStartPoint = coord;
		} else {
			this.clearExtrude();
		}
	}

	private handleExtrudeDrag(event: any) {
		if (!this.extrudeEdge || !this.selectedFeature || !this.extrudeStartPoint) return;

		const geom = this.selectedFeature.getGeometry() as Polygon;
		if (!geom) return;

		const currentCoord = this.map.getCoordinateFromPixel(event.pixel);
		const [p1, p2] = this.extrudeEdge;

		// Edge perpendicular direction
		const dx = p2[0] - p1[0];
		const dy = p2[1] - p1[1];
		const len = Math.sqrt(dx * dx + dy * dy);
		if (len === 0) return;

		const nx = -dy / len;
		const ny = dx / len;

		// Project mouse movement onto perpendicular
		const mx = currentCoord[0] - this.extrudeStartPoint[0];
		const my = currentCoord[1] - this.extrudeStartPoint[1];
		const projection = mx * nx + my * ny;

		// Move both edge vertices along perpendicular
		const coords = geom.getCoordinates()[0];
		const newCoords = coords.map((c) => {
			if (c[0] === p1[0] && c[1] === p1[1]) {
				return [p1[0] + nx * projection, p1[1] + ny * projection];
			}
			if (c[0] === p2[0] && c[1] === p2[1]) {
				return [p2[0] + nx * projection, p2[1] + ny * projection];
			}
			return c;
		});

		geom.setCoordinates([newCoords]);
		this.extrudeStartPoint = currentCoord;

		// Update extrudeEdge to track the moved vertices
		for (let i = 0; i < newCoords.length - 1; i++) {
			const c1 = coords[i];
			const c2 = coords[i + 1];
			if (c1[0] === p1[0] && c1[1] === p1[1] && c2[0] === p2[0] && c2[1] === p2[1]) {
				this.extrudeEdge = [newCoords[i], newCoords[i + 1]];
				break;
			}
		}

		this.markAsEdited(this.selectedFeature);
	}

	private clearExtrude() {
		this.extrudeEdge = null;
		this.extrudeStartPoint = null;
	}

	private clearSplit() {
		this.splitPoints = [];
		this.splitLineSource.clear();
	}

	// ── Split mode ────────────────────────────────────────────────────

	private handleSplitClick(event: any) {
		const coord = this.map.getCoordinateFromPixel(event.pixel);
		this.splitPoints.push(coord);

		// Update split line preview
		this.splitLineSource.clear();
		if (this.splitPoints.length >= 2) {
			this.splitLineSource.addFeature(new Feature({ geometry: new LineString(this.splitPoints) }));
		}

		if (this.splitPoints.length >= 2) {
			if (this.selectedFeature) {
				this.splitPolygon(this.selectedFeature, this.splitPoints);
			}
			this.splitPoints = [];
			this.splitLineSource.clear();
		}
	}

	// ── Split preview (called from map page) ──────────────────────────

	updateSplitPreview() {
		this.splitLineSource.clear();
		if (this.splitPoints.length === 0) return;

		// Dynamic import in sync context isn't possible, use the constructor import
		// We'll handle this differently
	}

	// ── Public API ────────────────────────────────────────────────────

	toggleSnap() {
		this.snapEnabled = !this.snapEnabled;
		this.snapInteraction.setActive(this.snapEnabled);
	}

	private markAsEdited(feature: Feature) {
		const id = feature.getId()?.toString();
		if (id) {
			this.editedFeatures.add(id);
			feature.setStyle(editedStyle);
			this.hasChanges = true;
		}
	}

	resetEdits() {
		for (const f of this.getAllFeatures()) {
			const id = f.getId()?.toString();
			if (id && this.editedFeatures.has(id)) {
				f.setStyle(undefined);
			}
		}
		this.editedFeatures.clear();
		this.hasChanges = false;
	}

	getEditedFeatures(): Feature[] {
		return this.getAllFeatures().filter((f) =>
			this.editedFeatures.has(f.getId()?.toString() ?? '')
		);
	}

	clearSelection() {
		this.selectInteraction.getFeatures().clear();
		this.selectedFeature = null;
		this.clearExtrude();
		this.clearVertexOverlay();
	}

	private getAllFeatures(): Feature[] {
		const features: Feature[] = [];
		for (const layer of this.vectorLayers) {
			const source = layer.getSource();
			if (source) features.push(...source.getFeatures());
		}
		return features;
	}

	private pointToLineDistance(point: Coordinate, a: Coordinate, b: Coordinate): number {
		const [px, py] = point;
		const [ax, ay] = a;
		const [bx, by] = b;
		const dx = bx - ax;
		const dy = by - ay;
		const lenSq = dx * dx + dy * dy;
		if (lenSq === 0) return Math.sqrt((px - ax) ** 2 + (py - ay) ** 2);
		const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / lenSq));
		const projX = ax + t * dx;
		const projY = ay + t * dy;
		return Math.sqrt((px - projX) ** 2 + (py - projY) ** 2);
	}

	splitPolygon(feature: Feature<Geometry>, linePoints: Coordinate[]) {
		const geom = feature.getGeometry() as Polygon;
		if (!geom) return;

		const coords = geom.getCoordinates()[0];
		if (!coords || coords.length < 3) return;

		const line = turf.lineString(linePoints);
		const polyGeoJson = {
			type: 'Feature' as const,
			geometry: { type: 'Polygon' as const, coordinates: [coords] }
		};

		try {
			const split = turfLineSplit(polyGeoJson as any, line as any);
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

	destroy() {
		this.map.removeInteraction(this.selectInteraction);
		this.map.removeInteraction(this.modifyInteraction);
		this.map.removeInteraction(this.snapInteraction);
		this.map.removeInteraction(this.vertexModify);
		this.map.removeLayer(this.vertexLayer);
		this.map.removeLayer(this.splitLineLayer);
	}
}
