<script lang="ts">
	import { getContext } from 'svelte';
	import DefaultView from '$lib/view/default/components/DefaultView.svelte';
	import type { ViewController } from '$lib/controller/table.svelte.js';

	let { data } = $props();

	const controller: ViewController = getContext('viewsController');
</script>

<div class="size-svw">
	<p>Content</p>
</div>
<!-- <DefaultView {controller} /> -->
