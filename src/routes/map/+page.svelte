<script lang="ts">
	import { onMount, getContext } from 'svelte';
	import { browser } from '$app/environment';
	import { page } from '$app/state';
	import { replaceState } from '$app/navigation';

	import Map from 'ol/Map';
	import View from 'ol/View';
	import Feature from 'ol/Feature';
	import { Polygon, LineString } from 'ol/geom';
	import VectorLayer from 'ol/layer/Vector';
	import VectorSource from 'ol/source/Vector';
	import Select from 'ol/interaction/Select';
	import { singleClick } from 'ol/events/condition';
	import { Style, Fill, Stroke, Circle as CircleStyle } from 'ol/style';

	import { MapViewController, type MapTableData } from '$lib/view/map.svelte';
	import type { MapConfig } from '$lib/builders/map.config';
	import { GeometryEditor } from '$lib/view/map/editor.svelte';
	import type { DBContext } from '../+layout.svelte';

	let { data } = $props();

	const db = getContext<DBContext>('db');
	const canEdit = $derived(db.isEditor());

	// Refs
	let mapContainer: HTMLDivElement | undefined = $state(undefined);

	// OL objects - no $state to avoid proxy issues
	let olMap: Map | null = null;
	let editor: GeometryEditor | null = null;
	let defaultStyle: Style | null = null;

	// UI-only reactive state
	let activeTool = $state<'select' | 'add-point' | 'remove-point' | 'extrude-edge' | 'split' | 'combine'>('select');
	let snapEnabled = $state(true);
	let hasChanges = $state(false);
	let selectedFeatureName = $state<string | null>(null);

	onMount(() => {
		if (!browser || !mapContainer) return;

		const mapConfig = data.mapConfig as MapConfig;


		// Styles (browser-only)
		defaultStyle = new Style({
			image: new CircleStyle({
				radius: 7,
				fill: new Fill({ color: 'rgba(59, 130, 246, 0.6)' }),
				stroke: new Stroke({ color: '#3b82f6', width: 2 })
			}),
			stroke: new Stroke({ color: 'rgba(59, 130, 246, 0.8)', width: 2 }),
			fill: new Fill({ color: 'rgba(59, 130, 246, 0.15)' })
		});

		// Grid - huge extent with large renderBuffer
		const gridSize = 2000;
		const EXTENT = 100000;

		const bgLayer = new VectorLayer({
			source: new VectorSource({
				features: [new Feature({
					geometry: new Polygon([[
						[-EXTENT, -EXTENT], [EXTENT, -EXTENT],
						[EXTENT, EXTENT], [-EXTENT, EXTENT], [-EXTENT, -EXTENT]
					]])
				})]
			}),
			style: new Style({ fill: new Fill({ color: '#ffffff' }) }),
			renderBuffer: 1000000,
			zIndex: -2
		});

		const gridFeatures: Feature[] = [];
		for (let x = -EXTENT; x <= EXTENT; x += gridSize) {
			gridFeatures.push(new Feature({ geometry: new LineString([[x, -EXTENT], [x, EXTENT]]) }));
		}
		for (let y = -EXTENT; y <= EXTENT; y += gridSize) {
			gridFeatures.push(new Feature({ geometry: new LineString([[-EXTENT, y], [EXTENT, y]]) }));
		}
		const gridLayer = new VectorLayer({
			source: new VectorSource({ features: gridFeatures }),
			style: new Style({ stroke: new Stroke({ color: '#e5e7eb', width: 1 }) }),
			renderBuffer: 1000000,
			zIndex: -1
		});

		// Vector layers from data
		const vectorLayers: VectorLayer<VectorSource>[] = [];
		const mapData = data.mapData as MapTableData[];

		for (const tableData of mapData) {
			const layerConfig = mapConfig.layers.find((l) => l.table === tableData.table);
			if (layerConfig && tableData.features.length > 0) {
				const layer = MapViewController.createLayer(tableData.features, layerConfig);
				layer.getSource()?.getFeatures().forEach((f) => f.setStyle(defaultStyle!));
				vectorLayers.push(layer);
			}
		}

		// Compute data extent for initial zoom
		let dataMinX = Infinity, dataMinY = Infinity, dataMaxX = -Infinity, dataMaxY = -Infinity;
		for (const layer of vectorLayers) {
			const source = layer.getSource();
			if (source) {
				const ext = source.getExtent();
				if (ext) {
					dataMinX = Math.min(dataMinX, ext[0]);
					dataMinY = Math.min(dataMinY, ext[1]);
					dataMaxX = Math.max(dataMaxX, ext[2]);
					dataMaxY = Math.max(dataMaxY, ext[3]);
				}
			}
		}

		// Map - fit to data extent
		olMap = new Map({
			target: mapContainer,
			layers: [bgLayer, gridLayer, ...vectorLayers],
			view: new View({
				projection: 'EPSG:3857',
				center: [(dataMinX + dataMaxX) / 2, (dataMinY + dataMaxY) / 2],
				zoom: 0,
				minZoom: 0,
				maxZoom: 18,
				constrainResolution: false
			})
		});

		// Fit to data extent
		const padding = 50;
		olMap.getView().fit([dataMinX, dataMinY, dataMaxX, dataMaxY], { padding: [padding, padding, padding, padding] });

		// Editor - only initialize if user can edit
		if (canEdit) {
			editor = new GeometryEditor(olMap, vectorLayers, {
				onFeatureSelect: (feature) => {
					if (feature) {
						const id = feature.getId()?.toString();
						const name = feature.get('name') || id || 'Unknown';
						selectedFeatureName = name;
						if (id) replaceState('', { map: { selectedFeatureId: id } });
					} else {
						selectedFeatureName = null;
						replaceState('', { map: undefined });
					}
				},
				onToolChange: (tool) => { activeTool = tool; },
				onSaveRequired: (changes) => { hasChanges = changes; }
			});
			snapEnabled = editor.snapEnabled;
		} else {
			// View-only: simple click selection without editing
			const select = new Select({
				condition: singleClick,
				layers: vectorLayers
			});
			olMap.addInteraction(select);
			select.on('select', (event) => {
				const selected = event.selected[0] ?? null;
				if (selected) {
					const id = selected.getId()?.toString();
					selectedFeatureName = selected.get('name') || id || 'Unknown';
					if (id) replaceState('', { map: { selectedFeatureId: id } });
				} else {
					selectedFeatureName = null;
					replaceState('', { map: undefined });
				}
			});
		}

		// Restore selection from page state
		if (page.state.map?.selectedFeatureId) {
			const featureId = page.state.map.selectedFeatureId;
			for (const layer of vectorLayers) {
				const source = layer.getSource();
				if (source) {
					const feature = source.getFeatureById(featureId);
					if (feature) {
						if (editor) {
							editor.selectedFeature = feature;
						}
						selectedFeatureName = feature.get('name') || featureId;
						break;
					}
				}
			}
		}

		return () => {
			editor?.destroy();
			olMap?.setTarget(undefined);
		};
	});

	function handleSave() {
		if (!editor) return;
		const edited = editor.getEditedFeatures();
		alert(`Saved ${edited.length} features`);
		editor.resetEdits();
		hasChanges = false;
	}

	function handleReset() {
		if (!olMap || !defaultStyle) return;
		olMap.getAllLayers().forEach((layer) => {
			if (layer instanceof VectorLayer) {
				layer.getSource()?.getFeatures().forEach((f) => f.setStyle(defaultStyle!));
			}
		});
		editor?.resetEdits();
		hasChanges = false;
	}

	function setTool(tool: typeof activeTool) {
		editor?.setTool(tool);
		activeTool = tool;
	}

	function toggleSnap() {
		editor?.toggleSnap();
		snapEnabled = editor?.snapEnabled ?? !snapEnabled;
	}

	function zoomToFitAll() {
		if (!olMap) return;
		const extent = olMap.getAllLayers().reduce((acc, layer) => {
			if (layer instanceof VectorLayer) {
				const source = layer.getSource();
				if (source) {
					const e = source.getExtent();
					if (e && !e.every((v) => v === Infinity || v === -Infinity)) {
						return acc ?? e;
					}
				}
			}
			return acc;
		}, null as [number, number, number, number] | null);
		if (extent) {
			olMap.getView().fit(extent, { duration: 500, padding: [50, 50, 50, 50] });
		}
	}

	const tools = [
		{ id: 'select' as const, label: 'Select', icon: '🎯', desc: 'Select feature' },
		{ id: 'add-point' as const, label: 'Add Point', icon: '➕', desc: 'Add vertex to edge' },
		{ id: 'remove-point' as const, label: 'Remove Point', icon: '➖', desc: 'Remove vertex' },
		{ id: 'extrude-edge' as const, label: 'Extrude', icon: '↔️', desc: 'Move entire edge' },
		{ id: 'split' as const, label: 'Split', icon: '✂️', desc: 'Split polygon' },
		{ id: 'combine' as const, label: 'Combine', icon: '🔗', desc: 'Merge polygons' }
	];
</script>

<div class="flex size-full flex-col">
	<div class="relative size-full">
		<div bind:this={mapContainer} class="size-full"></div>

		{#if canEdit}
			<!-- Editor toolbar - only shown for editors -->
			<div class="absolute left-4 top-4 z-20 flex flex-col gap-2">
				<div class="flex flex-col gap-1 rounded-lg bg-background/95 p-2 shadow-lg">
					{#each tools as tool}
						<button
							class="flex items-center gap-2 rounded px-3 py-2 text-sm transition-colors
								{activeTool === tool.id ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'}"
							title={tool.desc}
							onclick={() => setTool(tool.id)}
						>
							<span>{tool.icon}</span>
							<span>{tool.label}</span>
						</button>
					{/each}
				</div>

				<div class="rounded-lg bg-background/95 p-2 shadow-lg">
					<button
						class="flex w-full items-center gap-2 rounded px-3 py-2 text-sm transition-colors
							{snapEnabled ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-700'}"
						title="Toggle snap"
						onclick={toggleSnap}
					>
						<span>🧲</span>
						<span>Snap {snapEnabled ? 'ON' : 'OFF'}</span>
					</button>
				</div>

				{#if hasChanges}
					<div class="rounded-lg bg-background/95 p-2 shadow-lg">
						<button
							class="flex w-full items-center gap-2 rounded bg-green-500 px-3 py-2 text-sm text-white hover:bg-green-600"
							onclick={handleSave}
						>
							<span>💾</span>
							<span>Save Changes</span>
						</button>
						<button
							class="mt-1 flex w-full items-center gap-2 rounded bg-gray-200 px-3 py-2 text-sm text-gray-700 hover:bg-gray-300"
							onclick={handleReset}
						>
							<span>↩️</span>
							<span>Reset</span>
						</button>
					</div>
				{/if}
			</div>
		{:else}
			<!-- Viewer badge -->
			<div class="absolute left-4 top-4 z-20 rounded-lg bg-background/95 px-3 py-2 shadow-lg">
				<span class="text-sm text-muted-foreground">👁️ View only</span>
			</div>
		{/if}

		{#if selectedFeatureName}
			<div class="absolute left-1/2 top-4 z-20 -translate-x-1/2 rounded-lg bg-background/95 px-4 py-2 shadow-lg">
				<span class="text-sm font-medium">{selectedFeatureName}</span>
			</div>
		{/if}

		<!-- Bottom controls -->
		<div class="absolute bottom-4 left-4 z-20">
			<button
				class="rounded-lg bg-background/95 px-3 py-2 text-sm shadow-lg hover:bg-accent"
				onclick={zoomToFitAll}
			>
				🗺️ Fit All
			</button>
		</div>

		<!-- Legend -->
		<div class="absolute bottom-4 right-4 z-20 rounded-lg bg-background/95 p-3 shadow-lg">
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
