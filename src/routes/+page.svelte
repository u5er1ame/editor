<script lang="ts">
  import Graph from "$lib/components/Graph.svelte";
  import { SvelteFlowProvider } from "@xyflow/svelte";
  import type { ColorMode } from "@xyflow/system";

  let { data } = $props();
  const d = data.electric_rooms;
  let test_data = $state.raw(d);

const edges = $state.raw([
]);

let colorMode: ColorMode = $state("system");
</script>

<SvelteFlowProvider>
  <Graph nodes={test_data} {edges} {colorMode} />
</SvelteFlowProvider>
