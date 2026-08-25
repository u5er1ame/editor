<script lang="ts">
	import { onMount, getContext } from 'svelte';
	import { browser } from '$app/environment';
	import { page } from '$app/state';
	import { replaceState } from '$app/navigation';
	import { toast } from 'svelte-sonner';

	import Map from 'ol/Map';
	import View from 'ol/View';
	import Feature from 'ol/Feature';
	import GeoJSON from 'ol/format/GeoJSON';
	import VectorLayer from 'ol/layer/Vector';
	import VectorSource from 'ol/source/Vector';
	import Select from 'ol/interaction/Select';
	import { singleClick } from 'ol/events/condition';
	import { Style, Fill, Stroke, Circle as CircleStyle } from 'ol/style';
	import { mode } from 'mode-watcher';

	import { MapViewController, type MapTableData } from '$lib/view/map.svelte';
	import type { MapConfig } from '$lib/builders/map.config';
	import { GeometryEditor, type EditMode } from '$lib/view/map/editor.svelte';
	import {
		CONSTRAINT_EXTENT,
		createBackgroundLayer,
		readThemeColors
	} from '$lib/view/map/background';
	import { saveGeometry } from '$lib/db.remote';
	import type { DBContext } from '../+layout.svelte';

	let { data } = $props();

	const db = getContext<DBContext>('db');
	const canEdit = $derived(db.isEditor());

	// Refs
	let mapContainer: HTMLDivElement | undefined = $state(undefined);

	// OL objects - no $state to avoid proxy issues
	let olMap: Map | null = null;
	let editor: GeometryEditor | null = $state(null);
	let defaultStyle: Style | null = null;
	let bg: ReturnType<typeof createBackgroundLayer> | null = null;

	// UI-only reactive state derived from editor
	let selectedFeatureName = $state<string | null>(null);
	let activeMode = $state<EditMode>('select');

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

		// Infinite canvas background (tile-based, no fit/zoom interference)
		bg = createBackgroundLayer(readThemeColors(mode.current === 'dark'));

		// Vector layers from data
		const vectorLayers: VectorLayer<VectorSource>[] = [];
		const mapData = data.mapData as MapTableData[];

		for (const tableData of mapData) {
			const layerConfig = mapConfig.layers.find((l) => l.table === tableData.table);
			if (layerConfig && tableData.features.length > 0) {
				const layer = MapViewController.createLayer(tableData.features, layerConfig);
				layer
					.getSource()
					?.getFeatures()
					.forEach((f) => f.setStyle(defaultStyle!));
				vectorLayers.push(layer);
			}
		}

		// Compute data extent for initial zoom
		let dataMinX = Infinity,
			dataMinY = Infinity,
			dataMaxX = -Infinity,
			dataMaxY = -Infinity;
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
			layers: [bg!.layer, ...vectorLayers],
			view: new View({
				projection: 'EPSG:3857',
				center: [(dataMinX + dataMaxX) / 2, (dataMinY + dataMaxY) / 2],
				zoom: 10,
				minZoom: 6,
				maxZoom: 18,
				// extent: CONSTRAINT_EXTENT,
				constrainResolution: false
			})
		});

		// Fit to data extent
		const padding = 50;
		olMap.getView().fit([dataMinX, dataMinY, dataMaxX, dataMaxY], {
			padding: [padding, padding, padding, padding]
		});

		// Editor - only initialize if user can edit
		if (canEdit) {
			editor = new GeometryEditor(olMap, vectorLayers, {
				onSelect: (feature) => {
					if (feature) {
						const id = feature.getId()?.toString();
						selectedFeatureName = feature.get('name') || id || 'Unknown';
						if (id) replaceState('', { map: { selectedFeatureId: id } });
					} else {
						selectedFeatureName = null;
						replaceState('', { map: undefined });
					}
				}
			});
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

	// React to dark/light mode changes
	$effect(() => {
		const isDark = mode.current === 'dark';
		if (!bg) return;
		// Wait for CSS variables to settle after class toggle
		requestAnimationFrame(() => {
			bg!.setColors(readThemeColors(isDark));
		});
	});

	async function handleSave() {
		if (!editor) return;
		const edited = editor.getEditedFeatures();
		const geoJsonFormat = new GeoJSON();

		let savedCount = 0;
		let failedCount = 0;
		for (const feature of edited) {
			const id = feature.getId()?.toString();
			const geom = feature.getGeometry();
			if (!id || !geom) continue;
			const geoJson = geoJsonFormat.writeGeometryObject(geom, {
				dataProjection: 'EPSG:3857',
				featureProjection: 'EPSG:3857'
			});
			const table = id.split(':')[0];
			const result = await saveGeometry({ table, id, geometry: geoJson as any });
			if (result) savedCount++;
			else failedCount++;
		}

		if (failedCount > 0) {
			toast.error(`Failed to save ${failedCount} feature(s)`);
		} else {
			toast.success(`Saved ${savedCount} feature(s)`);
		}
		editor?.resetEdits();
	}

	function handleReset() {
		if (!olMap || !defaultStyle) return;
		olMap.getAllLayers().forEach((layer) => {
			if (layer instanceof VectorLayer) {
				layer
					.getSource()
					?.getFeatures()
					.forEach((f) => f.setStyle(defaultStyle!));
			}
		});
		editor?.resetEdits();
	}

	function setMode(m: EditMode) {
		editor?.setMode(m);
		activeMode = m;
	}

	function toggleSnap() {
		editor?.toggleSnap();
	}

	function zoomToFitAll() {
		if (!olMap) return;
		const extent = olMap.getAllLayers().reduce(
			(acc, layer) => {
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
			},
			null as [number, number, number, number] | null
		);
		if (extent) {
			olMap.getView().fit(extent, { duration: 500, padding: [50, 50, 50, 50] });
		}
	}

	const modes = [
		{
			id: 'select' as const,
			label: 'Select',
			icon: 'iconify material-symbols--near-me',
			desc: 'Select feature',
			requiresSelection: false
		},
		{
			id: 'move' as const,
			label: 'Move',
			icon: 'iconify material-symbols--open-with',
			desc: 'Drag to move features',
			requiresSelection: true
		},
		{
			id: 'point-edit' as const,
			label: 'Points',
			icon: 'iconify material-symbols--gesture',
			desc: 'Edit vertices',
			requiresSelection: true
		},
		{
			id: 'extrude' as const,
			label: 'Extrude',
			icon: 'iconify material-symbols--expand',
			desc: 'Move edge to reshape polygon',
			requiresSelection: true
		},
		{
			id: 'split' as const,
			label: 'Split',
			icon: 'iconify material-symbols--content-cut',
			desc: 'Cut polygon with a line',
			requiresSelection: true
		}
	];
</script>

<div class="flex size-full flex-col">
	<div class="relative size-full">
		<div bind:this={mapContainer} class="size-full"></div>

		{#if canEdit}
			<!-- Editor toolbar - only shown for editors -->
			<div class="absolute top-4 left-4 z-20 flex flex-col gap-2">
				<div class="flex flex-col gap-1 rounded-lg bg-popover p-2 shadow-lg">
					{#each modes as m}
						<button
							class="flex items-center gap-2 rounded px-3 py-2 text-sm transition-colors disabled:text-muted-foreground disabled:hover:bg-transparent
								{activeMode === m.id ? 'bg-active text-primary-foreground' : 'hover:bg-hover'}"
							title={m.desc}
							onclick={() => setMode(m.id)}>
							<span class="{m.icon} size-4"></span>
							<span>{m.label}</span>
						</button>
					{/each}
				</div>

				<div class="rounded-lg bg-popover p-2 shadow-lg">
					<button
						class="flex w-full items-center gap-2 rounded px-3 py-2 text-sm transition-colors
							{editor?.snapEnabled ? 'bg-active text-white' : ' text-gray-700'}"
						title="Toggle snap"
						onclick={() => toggleSnap()}>
						<span class="iconify size-4 solar--magnet-bold-duotone"></span>
						<span>Snap {editor?.snapEnabled ? 'ON' : 'OFF'}</span>
					</button>
				</div>

				{#if editor?.hasChanges}
					<div class="rounded-lg bg-popover p-2 shadow-lg">
						<button
							class="flex w-full items-center gap-2 rounded bg-active px-3 py-2 text-sm text-white hover:bg-hover"
							onclick={handleSave}>
							<span class="iconify size-4 material-symbols--save"></span>
							<span>Save Changes</span>
						</button>
						<button
							class="mt-1 flex w-full items-center gap-2 rounded px-3 py-2 text-sm text-gray-700 hover:bg-hover"
							onclick={() => handleReset()}>
							<span class="iconify size-4 material-symbols--restart-alt"></span>
							<span>Reset</span>
						</button>
					</div>
				{/if}
			</div>
		{:else}
			<!-- Viewer badge -->
			<div class="absolute top-4 left-4 z-20 rounded-lg bg-popover px-3 py-2 shadow-lg">
				<span class="iconify size-4 text-muted-foreground material-symbols--visibility"></span>
				<span class="text-sm text-muted-foreground">View only</span>
			</div>
		{/if}

		{#if selectedFeatureName}
			<div
				class="absolute top-4 left-1/2 z-20 -translate-x-1/2 rounded-lg bg-popover px-4 py-2 shadow-lg">
				<span class="text-sm font-medium">{selectedFeatureName}</span>
			</div>
		{/if}

		<!-- Bottom controls -->
		<div class="absolute bottom-4 left-4 z-20">
			<button
				class="rounded-lg bg-popover px-3 py-2 text-sm shadow-lg hover:bg-hover"
				onclick={zoomToFitAll}>
				🗺️ Fit All
			</button>
		</div>

		<!-- Legend -->
		<div class="absolute right-4 bottom-4 z-20 rounded-lg bg-popover p-3 shadow-lg">
			<h4 class="mb-2 text-sm font-semibold">Layers</h4>
			<ul class="space-y-1 text-xs">
				<!-- TODO: calculate list of layers and colors from styles  -->
			</ul>
		</div>
	</div>
</div>
