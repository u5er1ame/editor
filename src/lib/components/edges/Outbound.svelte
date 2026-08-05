<script lang="ts">
import { BaseEdge, getStraightPath, getBezierPath, type EdgeProps } from "@xyflow/svelte";

let { id, data, sourceX, sourceY, targetX, targetY, ...rest }: EdgeProps = $props();

let [path, labelX, labelY] = $derived(
    getBezierPath({
      sourceX,
      sourceY,
      targetX,
      targetY,
    })
  );
</script>

<BaseEdge style="--xy-edge-stroke-width:3px" {id} {path} {labelX} {labelY} {...rest} />

<style>
</style>
