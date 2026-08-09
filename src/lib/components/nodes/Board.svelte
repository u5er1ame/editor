<script lang="ts">
import { fade } from 'svelte/transition';
import { onMount } from 'svelte';
import { toast } from 'svelte-sonner';
import { ControlButton, NodeResizer, NodeToolbar, Position, useNodes, useOnSelectionChange, useSvelteFlow, type Edge, type Node, type NodeProps } from '@xyflow/svelte';
import type { Board } from '$lib/server/schemas';
import Dialog, { type FormTypes } from '$lib/components/Dialog.svelte';
import { type Form } from '$lib/components/Dialog.svelte';
	import { r, RecordId, StringRecordId } from 'surrealdb';
	import { resizer } from '$lib/utils';


type Props = {
    data?: { raw: Board, labelKey: keyof Board },
    class?: string
} & NodeProps<Node<Board>>

let item: HTMLDivElement | undefined = $state();

const { getZoom } = useSvelteFlow();
const zoom = $derived.by(getZoom);
const threshold = $derived(zoom<1);
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
    minWidth: width,
    minHeight: height,
    maxWidth: width*4 ?? width,
    maxHeight: height*4 ?? height,
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
<div role="button" tabindex="0" {ondblclick} bind:this={item} class="size-full flex items-stretch">
    <!-- {#if threshold} -->
	<p class="size-full text-foreground/40 content-center text-[1em]">{data?.raw[data.labelKey]}</p>
    <!-- {/if} -->
    {#if type == "unsaved_boards"}
        <button onclick={()=>toast.warning("Board not saved yet")} title="This item arnt saved to database"  class="absolute m-0.5 w-2 h-2 top-0 right-0 bg-amber-400/40 iconify solar--danger-triangle-bold-duotone"></button>
    {/if}
</div>
<NodeToolbar class="text-secondary-foreground h-full"  position={Position.Right} align="start" nodeId={id}>
    <div class="flex flex-col gap-1 *:rounded-lg" transition:fade>
        <ControlButton   title="Add breaker" onclick={()=>{openDialog=true}}>
            <span class="iconify material-symbols--add-2-rounded"></span>
        </ControlButton>
    <ControlButton  title="Rename board" onclick={()=>console.log("click")}>
        <span class="iconify solar--clapperboard-edit-bold-duotone"></span>
    </ControlButton>
    </div>
</NodeToolbar>
<NodeToolbar isVisible={!threshold} class="text-secondary text-md" offset={-4}  position={Position.Top} align="center" nodeId={id}>
    {data?.raw.name}
</NodeToolbar>

<style>
:global(.svelte-flow__node-unsaved_boards) {
border-radius: var(--radius);
width: "auto";
color: var(--color-destructive, var(--xy-node-color-default));
background-color: --alpha(var(--color-destructive, var(--xy-node-background-color-default))/7%);
text-align: center;
border: 1px dotted --alpha(var(--color-destructive)/30%);
}
:global(.svelte-flow__node-unsaved_boards.selected) {
    border: 1px solid --alpha(var(--color-destructive)/30%);
}


:global(.svelte-flow__node-boards) {
    border-radius: var(--radius);
    color: var(--color-secondary, var(--xy-node-color-default));
    &:global(.selectable) {
        border: 1px solid var(--color-border);
        background-color: --alpha(var(--color-primary, var(--xy-node-background-color-default))/50%);
        color: var(--color-primary, var(--xy-node-color-default));
    }
    &:not(.selectable) {
        border: 1px solid --alpha(var(--color-border)/30%);
        background-color: --alpha(var(--color-primary, var(--xy-node-background-color-default))/70%);
    }
}

:global(.svelte-flow__node-boards.selected) {
    border: 1px solid var(--color-active);
}

</style>
