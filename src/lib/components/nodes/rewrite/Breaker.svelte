<script lang="ts">
    import { type Edge, type Node, type NodeProps, getOutgoers, Handle, NodeResizer, Position, useNodesInitialized, useOnSelectionChange, useSvelteFlow } from '@xyflow/svelte';
    import type { Breaker } from '$lib/server/schemas';
    import { resizer } from '$lib/components/Graph.svelte';
	import { twMerge } from 'tailwind-merge';

    type Props = {
	data?: { raw: Breaker, labelKey: keyof Breaker },
	class?: string
    } & NodeProps<Node<Breaker>>
    let { id, data, type, class: className, width, height, ...rest }: Props = $props();

    let breaker: HTMLElement | undefined = $state();
    const { getZoom } = useSvelteFlow();
    const zoom = $derived.by(getZoom);

    let selectedNodes = $state<string[]>([]);
    useOnSelectionChange(({nodes}: { nodes: Node[], edges: Edge[] })=>{
        const selection = nodes.filter(n=>n.selected);
        selectedNodes = selection.map(n=>n.id);
    });
    let selected = $derived.by(()=>selectedNodes.length > 0 && selectedNodes.every(item=>item == id));
    let resizeable = $derived(selected && $resizer.get(id));

    // svelte-ignore state_referenced_locally
    let resizeProps = $state({
        minWidth: width,
        minHeight: height,
        maxWidth: width*4,
        maxHeight: height*4,
    });

    const flow = useSvelteFlow();
    // svelte-ignore state_referenced_locally
    const node = flow.getNode(id)
    let out = $state(false);
    $effect(()=>{
        if (useNodesInitialized().current && node) {
            out = getOutgoers(node, flow.getNodes(), flow.getEdges()).length > 0;
        }
    });
</script>

<NodeResizer {...resizeProps} isVisible={selected && resizeable} color="var(--color-orange-400)" lineClass="h-8" nodeId={id} />
<Handle type="target" position={Position.Top} />
<div class="size-full flex flex-col items-stretch">
    <p class={twMerge("size-full text-sm", out?"text-primary-foreground":"text-muted-foreground " )}>{data.raw[data.labelKey]}</p>
    {#if data.raw.value}
        <p class="size-full text-foreground text-xsm">{data?.value}A</p>
    {/if}
</div>
<Handle type="source" position={Position.Bottom} />

<style>
:global(.svelte-flow__node-breakers) {
border-radius: var(--radius);
width: "auto";
background-color: var(--color-secondary, var(--xy-node-group-background-color-default));
color: var(--color-primary, var(--xy-node-color-default));
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
