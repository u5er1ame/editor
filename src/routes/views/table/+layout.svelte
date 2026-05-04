<script lang="ts">
	import type { SchemaStore } from '$lib/model/schema_store';
	import { getContext } from 'svelte';

	let { children, data, ...rest } = $props();

	const model = getContext<SchemaStore>('model');
</script>
