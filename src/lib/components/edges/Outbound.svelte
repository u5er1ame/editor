<script lang="ts">
import { BaseEdge, getBezierPath, type EdgeProps } from "@xyflow/svelte";

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

<BaseEdge {id} {path} {labelX} {labelY} --xy-edge-stroke-width="3px" {...rest} />
