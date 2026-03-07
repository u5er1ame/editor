<script lang="ts">
import { fade } from 'svelte/transition';
import { onMount } from 'svelte';
import { toast } from 'svelte-sonner';
import { ControlButton, NodeResizer, NodeToolbar, Position, useNodes, useOnSelectionChange, useSvelteFlow, type Edge, type Node, type NodeProps } from '@xyflow/svelte';
import { Flow } from '$lib/utils';
import type { Board } from '$lib/server/schemas';
import { resizer } from '$lib/components/Graph.svelte';
import Dialog, { type FormTypes } from '$lib/components/Dialog.svelte';
import { type Form } from '$lib/components/Dialog.svelte';
	import { r, RecordId, StringRecordId } from 'surrealdb';


type Props = {
    data?: Board,
    class?: string
} & NodeProps<Node<Board>>

let item: HTMLDivElement | undefined = $state();

const { getZoom } = useSvelteFlow();
const zoom = $derived.by(getZoom);
const threshold = $derived(zoom<0.5);
const nodes = useNodes();

let { id, type, data, class: className, width, height, ...rest }: Props = $props();
// svelte-ignore state_referenced_locally
id = id || data?.id!.toString();


// let editName = $state(false);

onMount(()=>{
    return () => {
        $resizer.set(id, false);
    }
});

let selectedNodes = $state<string[]>([]);
useOnSelectionChange(({nodes}: { nodes: Node[], edges: Edge[] })=>{
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

const flow = useSvelteFlow();


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
// let boardNameInput: HTMLInputElement | null = $state(null);
// $effect(()=>{
//     if (editName == true) {
//         untrack(()=>{
//             boardNameInput?.focus({ preventScroll: true });
//         });
//     }
// });
// const onfocus = (e: FocusEvent &{ currentTarget: EventTarget & HTMLInputElement})=>e.currentTarget.select()

// const s = $derived(+(height!*flow.getZoom()).toFixed());

let openDialog = $state(false);
let dialogData: Form<FormTypes> = {
    name: {
        type: "input",
        label: "Name",
        description: "Enter board name",
        fieldProps: { id: "name", placeholder: "Q99" },
	errors: [],
    },
    description: {
        type: "select",
        label: "Description",
        description: "description",
        fieldProps: {
	    id: "description",
	    data: [
		{label: "a", value: "A"},
		{label: "b", value: "B"},
		{label: "c", value: "C"}
	    ]
	},
	errors: [],
    },
    value: {
        type: "input",
        label: "Value",
        description: "enter value",
        fieldProps: { id: "value", type: "number", placeholder: "100" },
	errors: [],
    }
}

let unsaved_count = $state(0);

async function createBreaker(data: {[key: keyof typeof dialogData]: any}) {
    $effect.root(()=>{ unsaved_count++ });
    const uid = id.split(":")[1];
    type = "unsaved_breakers";
    const child_id = [type, data.name, uid, unsaved_count].join("-");
    $resizer.set(child_id, false); // add to resizer list for toolbar (change later?)
    // $effect.root(()=>{
        nodes.update((current)=>{
        const item: Node<Board> = {
            id: child_id,
            type,
            parentId: id,
            expandParent: true,
            extent: "parent",
            position: { x: 0, y: 0 },
            width: 16,
            height: 16,
            data: {
                ...data,
                room: id
            }
        }
            return [...current, item];
        });
}

// function onblur(e: FocusEvent) {
//     e.stopPropagation();
//     editName=false
// }
// TODO: validate data by schema here or on fetch?
</script>

{#if openDialog}
<Dialog bind:open={openDialog} onsubmit={createBreaker} form={dialogData} />
{/if}
<NodeResizer {...resizeProps} isVisible={selected && resizeable} color="var(--color-orange-400)" lineClass="h-8" nodeId={id} />
<div bind:this={item} class="size-full flex items-stretch">
    {#if threshold}
	<p class="size-full text-stone-300 content-center text-[1em]">{data?.name}</p>
    {/if}
    {#if type == "unsaved_boards"}
        <button onclick={()=>toast.warning("Board not saved yet")} title="This item arnt saved to database"  class="absolute m-0.5 w-2 h-2 top-0 right-0 bg-amber-400/40 icon-[solar--danger-triangle-bold-duotone]"></button>
    {/if}
</div>
<NodeToolbar class="text-slate-500 h-full"  position={Position.Right} align="start" nodeId={id}>
    <div class="flex flex-col gap-1 *:rounded-lg" transition:fade>
        <ControlButton   title="Add breaker" onclick={()=>{openDialog=true}}>
            <span class="icon-[material-symbols--add-2-rounded]"></span>
        </ControlButton>
    <ControlButton  title="Rename board" onclick={()=>console.log("click")}>
        <span class="icon-[solar--clapperboard-edit-bold-duotone]"></span>
    </ControlButton>
    </div>
</NodeToolbar>
<NodeToolbar isVisible={!threshold} class="text-slate-500 text-md" offset={-4}  position={Position.Top} align="center" nodeId={id}>
    {data?.name}
</NodeToolbar>

<style>
:global(.svelte-flow__node-unsaved_boards) {
border-radius: 2px;
width: "auto";
color: var(--color-amber-200, var(--xy-node-color-default));
background-color: --alpha(var(--color-amber-700, var(--xy-node-background-color-default))/7%);
text-align: center;
border: 1px dotted --alpha(var(--color-amber-500)/30%);
}
:global(.svelte-flow__node-unsaved_boards.selected) {
    border: 1px solid --alpha(var(--color-amber-500)/30%);
}

:global(.svelte-flow__node-boards.selectable) {
color: var(--color-stone-200, var(--xy-node-color-default));
background-color: --alpha(var(--color-stone-700, var(--xy-node-background-color-default))/40%);
border: var(--xy-node-border, var(--xy-node-border-default));
}

:global(.svelte-flow__node-boards.selected) {
    border: 1px solid var(--color-emerald-500);
}

:global(.svelte-flow__node-boards.selected:hover) {
    border: 1px solid var(--color-emerald-300);
}

:global(.svelte-flow__node-boards.selectable:hover) {
box-shadow: var(--shadow-lg);
}
</style>
