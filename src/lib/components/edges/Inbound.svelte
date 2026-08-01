<script lang="ts">
import { BaseEdge, getStraightPath, type EdgeProps } from "@xyflow/svelte";

let { id, data, sourceX, sourceY, targetX, targetY, ...rest }: EdgeProps = $props();

let [path, labelX, labelY] = $derived(
    getStraightPath({
      sourceX,
      sourceY,
      targetX,
      targetY,
    })
  );
const centerY = $derived((targetY - sourceY) / 2 + sourceY);

const edgePath = $derived(
  `M ${sourceX} ${sourceY} L ${sourceX} ${centerY} L ${targetX} ${centerY} L ${targetX} ${targetY}`,
);
</script>

<!-- <BaseEdge {id} {path} {labelX} {labelY} {...rest} /> -->
<BaseEdge {id} path={edgePath} {...rest} />

<style>
</style>
