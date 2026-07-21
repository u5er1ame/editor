<script module lang="ts">
export type Props = NodeProps<Node<{raw: ElectricRoom, labelKey: keyof ElectricRoom}>> & HTMLAttributes<HTMLDivElement>
</script>

<script lang="ts">
import { onMount, untrack } from "svelte";
import { browser } from "$app/env";
import type { HTMLAttributes } from "svelte/elements";
import { fade } from "svelte/transition";
import { useResizeObserver } from "runed";
import { NodeResizer, NodeToolbar, Position, useOnSelectionChange, useSvelteFlow, type Node } from "@xyflow/svelte";
import type { NodeProps } from "@xyflow/system";

import { resizer } from "$lib/components/Graph.svelte";
import type { ElectricRoom } from "$lib/server/schemas";
import EditToolbar from "./EditToolbar.svelte";


let { id, data, type, class: className, children, width, height, ...rest }: Props = $props();

let content: HTMLElement | null = $state(null);

const labelKey = data?.labelKey ?? "name";
let editName = $state(false);
// svelte-ignore state_referenced_locally
let name = $state(data?.raw[labelKey]);

onMount(()=>{
    return () => {
        $resizer.set(id, false);
    }
});

let selectedNodes = $state<string[]>([]);
useOnSelectionChange(({nodes})=>{
    if (nodes.length == 0) { selectedNodes = []; return; }
    const selection = nodes.filter(n=>n.selected);
    selectedNodes = selection.map(n=>n.id);
    selection.forEach(n=>{
        if (n.id != id) return;
    });
});
let selected = $derived.by(()=>selectedNodes.length > 0 && selectedNodes.every(item=>item == id));
let resizeable = $derived(selected && $resizer.get(id));
const flow = useSvelteFlow();
const measured = $derived(flow.getNode(id)?.measured);
// svelte-ignore state_referenced_locally
let resizeProps = $state({
    minWidth: width ?? measured?.width,
    minHeight: height ?? measured?.height,
    // maxWidth: width*4,
    // maxHeight: height*4,
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
{#if browser}
<NodeResizer {...resizeProps} isVisible={selected && resizeable} color="var(--color-orange-400)" lineClass="" nodeId={id} />
<p {ondblclick} class="p-2 flex-1 text-foreground content-center opacity-30">{name}</p>
<EditToolbar isVisible={selected && zoom} bind:editable={editName} {id} size={s.toString()+"px"} />
{#if zoom}
    <NodeToolbar isVisible={zoom}  class="text-blueprint-light" offset={-3}  position={Position.Top} align="center" nodeId={id}>
        {#if editName}
            <!-- svelte-ignore a11y_autofocus -->
            <input bind:this={roomNameInput} {onfocus} class="w-full text-lg focus:bg-yellow-50 text-blueprint-text bg-transparent" bind:value={name} {onblur}>
        {:else}
            <p ondblclick={()=>{editName=true}} class="font-bold text-lg text-blueprint-light">{name}</p>
        {/if}
    </NodeToolbar>
{/if}
<NodeToolbar class="text-blueprint/10" offset={-4}  position={Position.Bottom} align="start" nodeId={id}>
    <p class="font-extralight italic size-auto">{data?.raw?.id}</p>
</NodeToolbar>
{/if}
<style>
:global(.svelte-flow__node-electric_rooms) {
    font-size: 24px;
    background-color: var(--color-blueprint-2, var(--xy-node-group-background-color-default));
    text-align: center;
    border: 1px dashed var(--foreground);
    backdrop-filter: blur(2px);
    &:hover {
        border: 1px solid var(--blueprint-yellow);
    }
}
:global(.svelte-flow__node-electric_rooms.selectable) {
    &:hover {
        border: 1px solid var(--blueprint-yellow);
    }
}
:global(.svelte-flow__node-electric_rooms.selectable.selected) {
border: 1px solid var(--color-blueprint-green);
box-shadow: var(--shadow-2xl);
}
:global(.svelte-flow__node-electric_rooms.selectable.selected:not(.draggable)) {
border: 1px solid var(--blueprint-orange);
box-shadow: var(--shadow-2xl);
}
:global(.svelte-flow__node-electric_rooms:not(.draggable)) {
/* background-color: var(--xy-node-group-background-color-default, var(--xy-node-group-background-color-default)); */
/* text-align: center; */
border: 1px dashed --alpha(var(--color-blueprint-yellow)/30%);
backdrop-filter: blur(2px);
}

</style>
