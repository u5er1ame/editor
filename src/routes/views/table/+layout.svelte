<script lang="ts">
import type { ModelStore } from '$lib/model/table.svelte.js';
import { getContext } from 'svelte';

let { children, data, ...rest } = $props();

const model = getContext<ModelStore>("model");
model.addView("svar");

</script>
