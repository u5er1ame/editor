import Feature from 'ol/Feature';
import Draw from 'ol/interaction/Draw';
import Select from 'ol/interaction/Select';
import Map from 'ol/Map';
import Point from 'ol/geom/Point';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import { Circle as CircleStyle, Fill, Stroke, Style } from 'ol/style';
import type { Coordinate } from 'ol/coordinate';

export type SearchPointMapData = {
	id: string;
	description: string;
	photo?: string | null;
	x: number;
	y: number;
	zone_id?: string | null;
};

export type PointPlacedEvent = {
	feature: Feature<Point>;
	coordinate: Coordinate;
};

export type SearchPointLayer = {
	layer: VectorLayer<VectorSource<Feature<Point>>>;
	source: VectorSource<Feature<Point>>;
	setPlacementActive: (active: boolean) => void;
	setPointSelectActive: (active: boolean) => void;
	addPoint: (point: SearchPointMapData) => Feature<Point>;
	removeFeature: (feature: Feature<Point>) => void;
	destroy: () => void;
};

const pointStyle = new Style({
	image: new CircleStyle({
		radius: 8,
		fill: new Fill({ color: '#f97316' }),
		stroke: new Stroke({ color: '#ffffff', width: 2 })
	})
});

export function createSearchPointLayer(
	map: Map,
	points: readonly SearchPointMapData[],
	onPlace?: (event: PointPlacedEvent) => void,
	onPointSelect?: (feature: Feature<Point>) => void
): SearchPointLayer {
	const source = new VectorSource<Feature<Point>>();
	const layer = new VectorLayer<VectorSource<Feature<Point>>>({
		source,
		style: pointStyle,
		zIndex: 1100
	});
	const draw = new Draw({ source, type: 'Point' });
	draw.setActive(false);
	const select = new Select({ layers: [layer] });
	select.setActive(true);

	for (const point of points) addPoint(point);
	map.addLayer(layer);
	map.addInteraction(draw);
	map.addInteraction(select);

	select.on('select', (event) => {
		const feature = event.selected[0] as Feature<Point> | undefined;
		if (feature && !draw.getActive()) {
			onPointSelect?.(feature);
		}
	});

	draw.on('drawend', (event) => {
		const feature = event.feature as Feature<Point>;
		const coordinate = feature.getGeometry()?.getCoordinates();
		if (coordinate) onPlace?.({ feature, coordinate });
	});

	function addPoint(point: SearchPointMapData) {
		const feature = new Feature<Point>({ geometry: new Point([point.x, point.y]) });
		feature.setId(point.id);
		feature.setProperties({
			description: point.description,
			photo: point.photo ?? null,
			zone_id: point.zone_id ?? null,
			searchPoint: true
		});
		source.addFeature(feature);
		return feature;
	}

	return {
		layer,
		source,
		setPlacementActive: (active) => {
			draw.setActive(active);
			select.setActive(!active);
		},
		setPointSelectActive: (active) => select.setActive(active),
		addPoint,
		removeFeature: (feature) => source.removeFeature(feature),
		destroy: () => {
			map.removeInteraction(draw);
			map.removeInteraction(select);
			map.removeLayer(layer);
		}
	};
}
