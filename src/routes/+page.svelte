<script lang="ts">
	import { SvelteFlowProvider } from '@xyflow/svelte';
	import type { ColorMode } from '@xyflow/system';
	import { mode } from 'mode-watcher';
	import ELK, { type ELK as Elk } from 'elkjs/lib/elk-api';
	import Worker from 'elkjs/lib/elk-worker?worker';
	import { toast } from 'svelte-sonner';
	import { browser } from '$app/environment';

	import Graph from '$lib/components/Graph.svelte';
	import { getContext } from 'svelte';
	import DefaultView from '$lib/view/components/DefaultView.svelte';
	import type { ViewController } from '$lib/controller/table.svelte.js';

	let { data } = $props();
	if (data.error != null)
		setTimeout(() => {
			toast.error(data.error, {});
		}, 100);
	// if (data.error != null) setTimeout(()=>{toast.error(data.error, { action: { label: "retry", onClick: invalidateAll }  });}, 1000);
	const controller: ViewController = getContext('viewsController');
	$inspect('page', controller);
	// INFO: svelte files run both on server and client
	let elk: Elk | null = $state(null);
	if (browser) {
		elk = new ELK({
			workerFactory: () =>
				new Worker({ name: new URL('elkjs/lib/elk-worker.min.js', import.meta.url).toString() })
		});
	}

	// INFO: use mode-watcher to resolve system color on startup
	let colorMode: ColorMode = $derived(mode.current ?? 'system');

	$effect(() => {
		return () => {
			if (elk) {
				elk.terminateWorker();
			}
		};
	});
</script>

<DefaultView {controller} />
<!-- <SvelteFlowProvider> -->
<!--   <!-- {#if data.error == null} --> -->
<!--     <Graph {elk} nodes={data.nodes} bind:colorMode /> -->
<!--   <!-- {/if} --> -->
<!-- </SvelteFlowProvider> -->
