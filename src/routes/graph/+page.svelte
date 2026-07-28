<script lang="ts" module>
	export const flowReady = writable(false);
</script>
<script lang="ts">
	import { SvelteFlowProvider } from '@xyflow/svelte';
	import type { ColorMode } from '@xyflow/system';
	import { mode } from 'mode-watcher';
	import ELK, { type ELK as Elk } from 'elkjs/lib/elk-api';
	import Worker from 'elkjs/lib/elk-worker?worker';
	import { browser } from '$app/environment';

	import Graph from '$lib/components/Graph.svelte';
	import { fade } from 'svelte/transition';
	import Spinner from '$lib/components/ui/spinner/spinner.svelte';
	import { writable } from 'svelte/store';

	let { data } = $props();
// $inspect(data);
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
		}
	});
</script>
<div class="flex grow size-full">
<SvelteFlowProvider>
	<Graph {elk} nodes={data.nodes} nodeTypes={data.nodeTypes} edges={data.edges} edgeTypes={data.edgeTypes} bind:colorMode />
	{#if !$flowReady && data.nodes.length > 0}
		<div out:fade class="absolute inset-0 bg-background flex flex-col items-center justify-center gap-4 bg-background text-foreground">
			<Spinner size="8" class="text-primary" />
			<p>Loading...</p>
		</div>
	{/if}
</SvelteFlowProvider>
</div>
