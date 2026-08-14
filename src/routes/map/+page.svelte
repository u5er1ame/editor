<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import { page } from '$app/state';
	import { replaceState } from '$app/navigation';

	import Map from 'ol/Map';
	import View from 'ol/View';
	import { fromLonLat } from 'ol/proj';
	import TileLayer from 'ol/layer/Tile';
	import OSM from 'ol/source/OSM';
	import VectorLayer from 'ol/layer/Vector';
	import VectorSource from 'ol/source/Vector';
	import Select from 'ol/interaction/Select';
	import { click } from 'ol/events/condition';
	import Overlay from 'ol/Overlay';
	import type Feature from 'ol/Feature';
	import type { Geometry } from 'ol/geom';

	import { MapViewController, type MapTableData } from '$lib/view/map.svelte';
	import type { MapConfig } from '$lib/builders/map.config';

	let { data } = $props();

	// Map state
	let map: Map | null = $state(null);
	let mapContainer: HTMLDivElement | undefined = $state(undefined);
	let layers = $state<VectorLayer<VectorSource>[]>([]);
	let selectedFeatureId: string | null = $state(page.state.map?.selectedFeatureId ?? null);
	let hoveredFeatureId: string | null = $state(null);
	let tooltipElement: HTMLDivElement | undefined = $state(undefined);
	let tooltipOverlay: Overlay | null = $state(null);
	let olSelect: Select | null = $state(null);

	// Selection state
	let selectionReady = $state(true);

	// Initialize map on mount
	onMount(() => {
		if (!browser || !mapContainer) return;

		const mapConfig = data.mapConfig as MapConfig;

		// Create base tile layer
		const baseLayer = new TileLayer({
			source: new OSM()
		});

		// Create vector layers from data
		const vectorLayers: VectorLayer<VectorSource>[] = [];
		const mapData = data.mapData as MapTableData[];

		for (const tableData of mapData) {
			const layerConfig = mapConfig.layers.find((l) => l.table === tableData.table);
			if (layerConfig && tableData.features.length > 0) {
				const layer = MapViewController.createLayer(tableData.features, layerConfig, mapConfig);
				vectorLayers.push(layer);
			}
		}

		layers = vectorLayers;

		// Create map
		const olMap = new Map({
			target: mapContainer,
			layers: [baseLayer, ...vectorLayers],
			view: new View({
				center: fromLonLat(mapConfig.center),
				zoom: mapConfig.zoom,
				minZoom: mapConfig.minZoom,
				maxZoom: mapConfig.maxZoom
			})
		});

		// Create tooltip overlay
		if (tooltipElement) {
			tooltipOverlay = new Overlay({
				element: tooltipElement,
				offset: [15, 0],
				positioning: 'center-left'
			});
			olMap.addOverlay(tooltipOverlay);
		}

		// Add select interaction (click)
		const select = new Select({
			condition: click,
			layers: vectorLayers
		});

		olMap.addInteraction(select);
		olSelect = select;

		// Handle selection
		select.on('select', (event) => {
			const selected = event.selected[0];
			if (selected) {
				const featureId = MapViewController.getFeatureId(selected);
				if (featureId) {
					selectedFeatureId = featureId;
					replaceState('', { map: { selectedFeatureId: featureId } });
				}
			} else {
				selectedFeatureId = null;
				replaceState('', { map: undefined });
			}
		});

		// Add hover interaction using pointermove event
		olMap.on('pointermove', (evt) => {
			if (evt.dragging) return;

			let hoveredFeature: Feature<Geometry> | null = null;
			olMap.forEachFeatureAtPixel(
				evt.pixel,
				(feature) => {
					hoveredFeature = feature as Feature<Geometry>;
				},
				{ layerFilter: (layer) => vectorLayers.includes(layer as any) }
			);

			if (hoveredFeature && tooltipOverlay && tooltipElement) {
				const featureId = MapViewController.getFeatureId(hoveredFeature);
				const properties = MapViewController.getFeatureProperties(hoveredFeature);

				hoveredFeatureId = featureId ?? null;
				olMap!.getViewport().style.cursor = 'pointer';

				// Show tooltip with feature name
				tooltipElement.innerHTML = `<div class="bg-background text-foreground px-2 py-1 rounded shadow-lg text-sm">${properties.name || featureId || 'Unknown'}</div>`;
				const geom = hoveredFeature.getGeometry();
				let coords: number[] | undefined;
				if (geom) {
					// Use interior point for polygons, center for others, or first coordinate
					if ('getInteriorPoint' in geom && typeof geom.getInteriorPoint === 'function') {
						coords = (geom as any).getInteriorPoint().getCoordinates();
					} else if (typeof geom.getCenter === 'function') {
						coords = (geom as any).getCenter();
					} else {
						coords = geom.getFirstCoordinate();
					}
				}
				tooltipOverlay.setPosition(coords);
			} else {
				hoveredFeatureId = null;
				olMap!.getViewport().style.cursor = '';
				if (tooltipOverlay) {
					tooltipOverlay.setPosition(undefined);
				}
			}
		});

		// Restore selection from page state
		if (selectedFeatureId) {
			vectorLayers.forEach((layer) => {
				const source = layer.getSource();
				if (source) {
					const feature = source.getFeatureById(selectedFeatureId!);
					if (feature) {
						select.getFeatures().push(feature);
					}
				}
			});
		}

		map = olMap;

		return () => {
			olMap.setTarget(undefined);
		};
	});

	// Zoom to selected feature
	function zoomToFeature() {
		if (!map || !selectedFeatureId) return;

		layers.forEach((layer) => {
			const source = layer.getSource();
			if (source) {
				const feature = source.getFeatureById(selectedFeatureId!);
				if (feature) {
					const geometry = feature.getGeometry();
					if (geometry) {
						map!.getView().fit(geometry.getExtent(), {
							duration: 500,
							maxZoom: 16
						});
					}
				}
			}
		});
	}

	// Clear selection
	function clearSelection() {
		selectedFeatureId = null;
		replaceState('', { map: undefined });

		if (olSelect) {
			olSelect.getFeatures().clear();
		}
	}

	// Zoom to fit all features
	function zoomToFitAll() {
		if (!map) return;

		const extent = layers.reduce((acc, layer) => {
			const source = layer.getSource();
			if (source) {
				const sourceExtent = source.getExtent();
				if (sourceExtent && !sourceExtent.every((v) => v === Infinity || v === -Infinity)) {
					return acc ? acc.join(',').split(',').map(Number) as [number, number, number, number] : sourceExtent;
				}
			}
			return acc;
		}, null as [number, number, number, number] | null);

		if (extent) {
			map.getView().fit(extent, {
				duration: 500,
				padding: [50, 50, 50, 50]
			});
		}
	}

	// Get selected feature data
	let selectedFeatureData = $derived.by(() => {
		if (!selectedFeatureId) return null;

		for (const layer of layers) {
			const source = layer.getSource();
			if (source) {
				const feature = source.getFeatureById(selectedFeatureId);
				if (feature) {
					return MapViewController.getFeatureProperties(feature);
				}
			}
		}
		return null;
	});
</script>

<div class="flex size-full flex-col">
	<!-- Map container -->
	<div class="relative size-full">
		<div bind:this={mapContainer} class="size-full"></div>

		<!-- Tooltip overlay -->
		<div bind:this={tooltipElement} class="pointer-events-none absolute"></div>

		<!-- Controls overlay -->
		<div class="absolute left-4 top-4 z-10 flex flex-col gap-2">
			<button
				class="rounded bg-background/90 px-3 py-2 text-sm shadow-md hover:bg-accent"
				onclick={zoomToFitAll}
			>
				Fit All
			</button>
			{#if selectedFeatureId}
				<button
					class="rounded bg-background/90 px-3 py-2 text-sm shadow-md hover:bg-accent"
					onclick={zoomToFeature}
				>
					Zoom to Selected
				</button>
				<button
					class="rounded bg-background/90 px-3 py-2 text-sm shadow-md hover:bg-accent"
					onclick={clearSelection}
				>
					Clear Selection
				</button>
			{/if}
		</div>

		<!-- Selected feature info -->
		{#if selectedFeatureData}
			<div class="absolute bottom-4 left-4 z-10 max-w-sm rounded bg-background/95 p-4 shadow-lg">
				<h3 class="mb-2 text-lg font-semibold">Selected Feature</h3>
				<dl class="grid grid-cols-2 gap-1 text-sm">
					{#each Object.entries(selectedFeatureData) as [key, value]}
						{#if key !== 'geometry' && key !== 'id'}
							<dt class="font-medium text-muted-foreground">{key}:</dt>
							<dd>{value}</dd>
						{/if}
					{/each}
				</dl>
			</div>
		{/if}

		<!-- Layer legend -->
		<div class="absolute bottom-4 right-4 z-10 rounded bg-background/95 p-3 shadow-lg">
			<h4 class="mb-2 text-sm font-semibold">Layers</h4>
			<ul class="space-y-1 text-xs">
				<li class="flex items-center gap-2">
					<span class="h-3 w-3 rounded-full bg-red-500"></span>
					<span>Locations</span>
				</li>
				<li class="flex items-center gap-2">
					<span class="h-3 w-3 rounded bg-blue-500/30 ring-1 ring-blue-500"></span>
					<span>Areas</span>
				</li>
				<li class="flex items-center gap-2">
					<span class="h-0.5 w-4 bg-green-500"></span>
					<span>Cables</span>
				</li>
			</ul>
		</div>
	</div>
</div>
