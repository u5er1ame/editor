<script lang="ts">
import { fade } from 'svelte/transition';
import { useResizeObserver } from "runed";
import { ControlButton, NodeResizer, NodeToolbar, Position, type Node, type NodeProps } from '@xyflow/svelte';
import { useOnSelectionChange } from '@xyflow/svelte';
import type { Board } from '$lib/server/schemas';


type Props = {
    data?: Board,
    class?: string
} & NodeProps<Node<Board>>

let node: HTMLDivElement | undefined = $state();

let resizeProps = $state({
    minWidth: 16,
    minHeight: 16,
    maxWidth: 128, // TODO: bind to parent
    maxHeight: 128,
});

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

useResizeObserver(()=>node, ([info])=>{
    if (!node || !info) return;
    resizeProps.minWidth = clamp(info.contentRect.width, node.scrollWidth , resizeProps.maxWidth)+8;
    resizeProps.minHeight = clamp(info.contentRect.height, node.scrollHeight, resizeProps.maxHeight)+8;
});


let { id, data, class: className, ...rest }: Props = $props();
id = id || data?.id.toString();

let selectedNodes = $state<string[]>([]);

useOnSelectionChange(({nodes})=>{
    const selection = nodes.filter(n=>n.selected);
    selectedNodes = selection.map(n=>n.id);
});

let selected = $derived.by(()=>selectedNodes.length > 0 && selectedNodes.every(item=>item == id));
let resizeable = $state(false);

const resizeControlProps = $derived.by(()=>{
    if (resizeable) {
	return {
	    title: "Disable resizing",
	    color: "var(--color-orange-500)",
	    bgColorHover: "var(--color-orange-500)",
	    borderColor: "var(--color-orange-500)",
	};
    }
    return {
	title: "Enable resizing",
    };
});
const onfocus = (e: FocusEvent &{ currentTarget: EventTarget & HTMLInputElement})=>e.currentTarget.select()
// TODO: validate data by schema here or on fetch?
</script>

<div bind:this={node} class="size-full flex items-stretch">
    <p class="size-full text-stone-300 content-center text-[10px]">{data?.name}</p>
    <NodeResizer {...resizeProps} handleClass="hidden invisible" lineClass="rounded-lg" isVisible={selected && resizeable} color="var(--color-yellow-100)" class="rounded-lg" nodeId={id} />
    <NodeToolbar class="text-slate-500 h-full"  position={Position.Right} align="start" nodeId={id}>
	<div class="flex flex-col gap-1 *:rounded-lg" transition:fade>
	    <ControlButton   title="Add board" onclick={()=>console.log("click")}>
		<span class="icon-[material-symbols--add-2-rounded]"></span>
	    </ControlButton>
	    <ControlButton {...resizeControlProps} onclick={()=>resizeable=!resizeable}>
		<span class="icon-[material-symbols--resize-rounded]"></span>
	    </ControlButton>
	</div>
    </NodeToolbar>
    <NodeToolbar class="text-slate-500" offset={-4}  position={Position.Top} align="center" nodeId={id}>
    </NodeToolbar>
    <NodeToolbar class="text-slate-500" offset={-5}  position={Position.Bottom} align="start" nodeId={id}>
    </NodeToolbar>
</div>

<style>
:global(.svelte-flow__node-boards.selectable) {
padding: 4px;
border-radius: 2px;
width: "auto";
color: var(--color-stone-200, var(--xy-node-color-default));
background-color: --alpha(var(--color-stone-700, var(--xy-node-background-color-default))/70%);
text-align: center;
border: var(--xy-node-border, var(--xy-node-border-default));
}

:global(.svelte-flow__node-boards.selectable:hover) {
box-shadow: var(--shadow-lg);
}
</style>
