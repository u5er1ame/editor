<script lang="ts">
	import { SvelteFlowProvider } from '@xyflow/svelte';
	import type { ColorMode } from '@xyflow/system';
	import { mode } from 'mode-watcher';
	import ELK, { type ELK as Elk } from 'elkjs/lib/elk-api';
	import Worker from 'elkjs/lib/elk-worker?worker';
	import { browser } from '$app/environment';

	import Graph from '$lib/components/Graph.svelte';

	let { data } = $props();
	$inspect("data", data);
	// INFO: svelte files run both on server and client
	let elk: Elk | null = $state(null);
	if (browser) {
		elk = new ELK({
			workerFactory: () =>
				new Worker({ name: new URL('elkjs/lib/elk-worker.min.js', import.meta.url).toString() })
		});
	}

	let colorMode: ColorMode = $derived(mode.current ?? 'system');
	$effect(() => {
		return () => {
			if (elk) {
				elk.terminateWorker();
			}
		};
	});
</script>

<SvelteFlowProvider>
	<Graph {elk} nodes={data.nodes} nodeTypes={data.nodeTypes} edges={data.edges} edgeTypes={data.edgeTypes} bind:colorMode />
</SvelteFlowProvider>
