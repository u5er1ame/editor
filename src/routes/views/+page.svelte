<script lang="ts">
	import type { ModelStore } from '$lib/model/table.svelte.js';
	import { getContext } from 'svelte';

let { data, ...rest } = $props();
const model = getContext<ModelStore>("model");
$inspect("page", model.tables);
</script>
