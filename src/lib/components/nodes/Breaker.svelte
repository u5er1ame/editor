<script lang="ts">
    import { type Node, type NodeProps, Handle, NodeToolbar, Position, useSvelteFlow, useViewport } from '@xyflow/svelte';
    import type { Breaker } from '$lib/server/schemas';

    type Props = {
	data?: Breaker,
	class?: string
    } & NodeProps<Node<Breaker>>
    let { id, data, class: className, ...rest }: Props = $props();

    let breaker: HTMLElement | undefined = $state();

    const { getZoom } = useSvelteFlow();
    const zoom = $derived.by(getZoom);

</script>

{#if zoom>1.5}
    <Handle type="target" position={Position.Top} />
    <Handle type="source" position={Position.Bottom} />
{/if}
<div class="size-full flex flex-col items-stretch">
    <p class="size-full text-amber-300 text-[6px]">{data?.name}</p>
    <p class="size-full text-amber-300 text-[3px]">{data?.value}A</p>
</div>

<style>
:global(.svelte-flow__node-breakers) {
border-radius: 0px;
width: "auto";
color: var(--color-stone-200, var(--xy-node-color-default));
text-align: center;
border: var(--xy-node-border, var(--xy-node-border-default));
}

:global(.svelte-flow__node-unsaved_breakers) {
border-radius: 0px;
width: "auto";
color: var(--color-amber-200, var(--xy-node-color-default));
text-align: center;
border: 1px dotted --alpha(var(--color-amber-500)/30%);
background-color: --alpha(var(--color-amber-700, var(--xy-node-background-color-default))/7%);
}
:global(.svelte-flow__node-unsaved_breakers.selected) {
border: 1px solid --alpha(var(--color-amber-500)/30%);
}

:global(.svelte-flow__node-breakers.selectable:hover) {
box-shadow: var(--shadow-lg);
}
</style>
