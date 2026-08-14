<script lang="ts">
	import type { GeometryEditor, EditTool } from './editor.svelte';
	import type Feature from 'ol/Feature';
	import type { Geometry } from 'ol/geom';

	let {
		editor,
		onSave,
		onReset
	}: {
		editor: GeometryEditor;
		onSave: () => void;
		onReset: () => void;
	} = $props();

	let activeTool = $derived(editor.state.activeTool);
	let snapEnabled = $derived(editor.state.snapEnabled);
	let hasChanges = $derived(editor.state.hasChanges);
	let selectedFeature = $derived(editor.state.selectedFeature);
	let selectedFeatureName = $derived.by(() => {
		if (!selectedFeature) return null;
		const props = selectedFeature.getProperties();
		return props.name || selectedFeature.getId() || 'Unknown';
	});

	const tools: { id: EditTool; label: string; icon: string; description: string }[] = [
		{ id: 'select', label: 'Select', icon: '🎯', description: 'Select feature' },
		{ id: 'add-point', label: 'Add Point', icon: '➕', description: 'Add vertex to edge' },
		{ id: 'remove-point', label: 'Remove Point', icon: '➖', description: 'Remove vertex' },
		{ id: 'extrude-edge', label: 'Extrude', icon: '↔️', description: 'Move entire edge' },
		{ id: 'split', label: 'Split', icon: '✂️', description: 'Split polygon with line' },
		{ id: 'combine', label: 'Combine', icon: '🔗', description: 'Merge two polygons' }
	];

	function setTool(tool: EditTool) {
		editor.setTool(tool);
	}

	function toggleSnap() {
		editor.toggleSnap();
	}

	function handleSave() {
		onSave();
	}

	function handleReset() {
		editor.resetEdits();
		onReset();
	}
</script>

<div class="absolute left-4 top-4 z-20 flex flex-col gap-2">
	<!-- Tool buttons -->
	<div class="flex flex-col gap-1 rounded-lg bg-background/95 p-2 shadow-lg">
		{#each tools as tool}
			<button
				class="flex items-center gap-2 rounded px-3 py-2 text-sm transition-colors {activeTool === tool.id
					? 'bg-primary text-primary-foreground'
					: 'hover:bg-accent'}"
				title={tool.description}
				onclick={() => setTool(tool.id)}
			>
				<span>{tool.icon}</span>
				<span>{tool.label}</span>
			</button>
		{/each}
	</div>

	<!-- Snap toggle -->
	<div class="rounded-lg bg-background/95 p-2 shadow-lg">
		<button
			class="flex w-full items-center gap-2 rounded px-3 py-2 text-sm transition-colors {snapEnabled
				? 'bg-green-500 text-white'
				: 'bg-gray-200 text-gray-700'}"
			title="Toggle snap to features"
			onclick={toggleSnap}
		>
			<span>🧲</span>
			<span>Snap {snapEnabled ? 'ON' : 'OFF'}</span>
		</button>
	</div>

	<!-- Actions -->
	{#if hasChanges}
		<div class="rounded-lg bg-background/95 p-2 shadow-lg">
			<button
				class="flex w-full items-center gap-2 rounded bg-green-500 px-3 py-2 text-sm text-white transition-colors hover:bg-green-600"
				onclick={handleSave}
			>
				<span>💾</span>
				<span>Save Changes</span>
			</button>
			<button
				class="mt-1 flex w-full items-center gap-2 rounded bg-gray-200 px-3 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-300"
				onclick={handleReset}
			>
				<span>↩️</span>
				<span>Reset</span>
			</button>
		</div>
	{/if}

	<!-- Selected feature info -->
	{#if selectedFeature}
		<div class="max-w-xs rounded-lg bg-background/95 p-3 shadow-lg">
			<h4 class="mb-1 text-sm font-semibold">Selected</h4>
			<p class="text-xs text-muted-foreground">{selectedFeatureName}</p>
			<p class="mt-1 text-xs text-muted-foreground">
				{selectedFeature.getGeometry()?.getType()}
			</p>
		</div>
	{/if}
</div>
