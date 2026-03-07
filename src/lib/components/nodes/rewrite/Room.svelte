<script module lang="ts">
export type Props = NodeProps<Node<ElectricRoom>> & HTMLAttributes<HTMLDivElement>
</script>

<script lang="ts">
import { onMount, untrack } from "svelte";
import type { HTMLAttributes } from "svelte/elements";
import { fade } from "svelte/transition";
import { useResizeObserver } from "runed";
import { NodeResizer, NodeToolbar, Position, useOnSelectionChange, useSvelteFlow, type Node } from "@xyflow/svelte";
import type { NodeProps } from "@xyflow/system";

import { resizer } from "$lib/components/Graph.svelte";
import { Flow } from "$lib/utils";
import type { ElectricRoom } from "$lib/server/schemas";
import EditToolbar from "./EditToolbar.svelte";


let { id, data, type, class: className, children, width, height, ...rest }: Props = $props();

let content: HTMLElement | null = $state(null);

let editName = $state(false);
// svelte-ignore state_referenced_locally
let name = $state(data?.name);

onMount(()=>{
    return () => {
        $resizer.set(id, false);
    }
});

let selectedNodes = $state<string[]>([]);
useOnSelectionChange(({nodes})=>{
    const selection = nodes.filter(n=>n.selected);
    selectedNodes = selection.map(n=>n.id);
});
let selected = $derived.by(()=>selectedNodes.length > 0 && selectedNodes.every(item=>item == id));
let resizeable = $derived(selected && $resizer.get(id));

// svelte-ignore state_referenced_locally
let resizeProps = $state({
    minWidth: Flow.dimensions[type].width,
    minHeight: Flow.dimensions[type].height,
    maxWidth: Flow.dimensions[type].width*4,
    maxHeight: Flow.dimensions[type].height*4,
});

useResizeObserver(()=>content, ([info])=>{
    // if (!content || !info) return;
    // resizeProps.minWidth = clamp(info.contentRect.width, content.scrollWidth , resizeProps.maxWidth)+8;
    // resizeProps.minHeight = clamp(info.contentRect.height, content.scrollHeight, resizeProps.maxHeight)+8;
    //     node.width = info.contentRect.width<resizeProps.maxWidth?info.contentRect.width:resizeProps.maxWidth
    //     node.height = info.contentRect.height<resizeProps.maxHeight?info.contentRect.height:resizeProps.maxHeight
    // if (node && once) { // TODO: just move it onMount?
    //     once = false;
    //     node.width = content.scrollWidth
    //     node.height = content.scrollHeight
    //     flow.updateNode(id, node);
    // }
});

const flow = useSvelteFlow();

let zoom = $derived(flow.getZoom() > 1);

function ondblclick(e: MouseEvent) {
    e.stopPropagation();
    const node = flow.getNode(id)
    if (!node) return;
    if (node.selectable) {
        flow.fitBounds(flow.getNodesBounds([node]),{ padding: .15 });
    }
    else {
        flow.updateNode(id, { selectable: true, selected: true });
    }
}
let roomNameInput: HTMLInputElement | null = $state(null);
$effect(()=>{
    if (editName == true) {
        untrack(()=>{
            roomNameInput?.focus({ preventScroll: true });
        });
    }
});
const onfocus = (e: FocusEvent &{ currentTarget: EventTarget & HTMLInputElement})=>e.currentTarget.select()
const s = $derived(+(height!*flow.getZoom()).toFixed());

function onblur(e: FocusEvent) {
    e.stopPropagation();
    editName=false
}

</script>

<NodeResizer {...resizeProps} isVisible={selected && resizeable} color="var(--color-orange-400)" lineClass="h-8" nodeId={id} />
<div bind:this={content} transition:fade {ondblclick} class="size-full" role="list">
    <div style:font-size={(s/4).toFixed()+"px"} class="text-stone-600 flex items-center justify-center size-full " {...rest}>
        {#if !zoom}
            <p>{name}</p>
        {/if}
    </div>
</div>
<EditToolbar isVisible={selected && zoom} bind:editable={editName} {id} size={s.toString()+"px"} />
{#if zoom}
    <NodeToolbar isVisible={zoom}  class="text-slate-500" offset={-3}  position={Position.Top} align="center" nodeId={id}>
        {#if editName}
            <!-- svelte-ignore a11y_autofocus -->
            <input bind:this={roomNameInput} {onfocus} class="w-full text-lg focus:bg-yellow-50 text-slate-500 bg-transparent" bind:value={name} {onblur}>
        {:else}
            <p ondblclick={()=>{editName=true}} class="font-bold text-lg text-slate-500">{name}</p>
        {/if}
    </NodeToolbar>
{/if}
<NodeToolbar class="text-slate-500" offset={-4}  position={Position.Bottom} align="start" nodeId={id}>
    <p class="font-extralight italic size-auto">{data?.id}</p>
</NodeToolbar>

<style>
.room {
font-size: 10px;
color: var(--xy-node-group-background-color-default, var(--xy-node-group-background-color-default));
text-align: left;
}
:global(.svelte-flow__node-electric_rooms) {
font-size: 10px;
background-color: var(--xy-node-group-background-color-default, var(--xy-node-group-background-color-default));
text-align: center;
border: 1px dashed --alpha(var(--color-stone-500)/30%);
backdrop-filter: blur(2px);
}
:global(.svelte-flow__node-electric_rooms.selectable.selected) {
border: 1px solid var(--color-emerald-500);
box-shadow: var(--shadow-2xl);
}
:global(.svelte-flow__node-electric_rooms.selectable.selected:not(.draggable)) {
border: 1px solid var(--color-yellow-500);
box-shadow: var(--shadow-2xl);
}
:global(.svelte-flow__node-electric_rooms:not(.draggable)) {
padding: 10px;
font-size: 10px;
background-color: var(--xy-node-group-background-color-default, var(--xy-node-group-background-color-default));
text-align: center;
border: 1px dashed --alpha(var(--color-yellow-400)/30%);
backdrop-filter: blur(2px);
}

</style>
