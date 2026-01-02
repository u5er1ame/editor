<script lang="ts">
    import { type Node, type NodeProps, Handle, Position } from '@xyflow/svelte';
    import type { Breaker } from '$lib/server/schemas';
    import { twMerge } from 'tailwind-merge';
    import clsx from 'clsx';

    type Props = {
	data?: Breaker,
	class?: string
    } & NodeProps<Node<Breaker>>
    let { id, data, class: className, ...rest }: Props = $props();
</script>

<div class="size-full flex items-stretch">
    <Handle type="target" position={Position.Top} />
    <p class="size-full text-amber-300 text-[8px]">{data?.name}</p>
    <Handle type="source" position={Position.Bottom} />
</div>

<style>
:global(.svelte-flow__node-breakers) {
padding: 2px;
border-radius: 1px;
width: "auto";
color: var(--color-stone-200, var(--xy-node-color-default));
text-align: center;
border: var(--xy-node-border, var(--xy-node-border-default));
}

:global(.svelte-flow__node-breakers.selectable:hover) {
box-shadow: var(--shadow-lg);
}
</style>
