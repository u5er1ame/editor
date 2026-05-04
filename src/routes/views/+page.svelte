<script lang="ts">
	import type { SchemaStore } from '$lib/model/schema_store';
	import { getContext } from 'svelte';

	let { data, ...rest } = $props();
	const model = getContext<SchemaStore>('model');
</script>
