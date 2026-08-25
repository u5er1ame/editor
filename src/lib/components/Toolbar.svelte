<script module>
</script>

<script lang="ts">
	import { fade } from 'svelte/transition';
	import { NodeToolbar, useOnSelectionChange } from '@xyflow/svelte';
	import { Toolbar, type Controls } from '$lib/client/toolbar.svelte';
	import {
		DragControl,
		ResizeControl,
		SelectableControl,
		SelectedNodesControl
	} from '$lib/client/toolbar_item.svelte';

	let { ready = $bindable(true) } = $props();

	const toolbar = new Toolbar();

	const lock = new DragControl({
		condition: () => toolbar.selectedNodes.length > 0
	});

	const selectable = new SelectableControl({
		condition: () => toolbar.selectedNodes.length > 0
	});

	const enable_resizer = new ResizeControl({
		condition: () => toolbar.selectedNodes.length == 1
	});

	useOnSelectionChange(({ nodes, edges }) => {
		toolbar.update(nodes, edges);
		toolbar.addControl(lock);
		toolbar.addControl(selectable);
		toolbar.addControl(enable_resizer);
	});
</script>

{#key toolbar.selectedNodes}
	<NodeToolbar
		isVisible={toolbar.isVisible && ready}
		position={toolbar.position}
		align={toolbar.align}
		nodeId={toolbar.nodeId}>
		<div
			transition:fade={{ duration: 200, delay: 30 }}
			class="flex w-full flex-row justify-evenly gap-1 *:rounded-lg">
			{#each toolbar.availableControls.sort((a, b) => (a.prio ?? 5) - (b.prio ?? 5)) as { item, props }}
				{@render item(props)}
			{/each}
		</div>
	</NodeToolbar>
{/key}
