<script lang="ts">
	import { getContext } from 'svelte';
	import Tabs from '$lib/view/table/components/Tabs.svelte';
	import type { ViewController } from '$lib/controller/table.svelte.js';

	let { data, ...rest } = $props();

	const controller: ViewController = getContext('viewsController');
</script>

<Tabs {controller} />
