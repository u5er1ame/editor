<script lang="ts">
    import { fade } from 'svelte/transition';
    import { ControlButton, NodeResizer, NodeToolbar, Position, type Node, type NodeProps } from '@xyflow/svelte';
    import { useOnSelectionChange, useViewport, useSvelteFlow, useInternalNode } from '@xyflow/svelte';
    import { twMerge } from 'tailwind-merge';
    import CustomControlButton from '../CustomControlButton.svelte';

    import type {  Board, ElectricRoom } from '$lib/server/schemas';
	import { useResizeObserver } from 'runed';
	import { Flow } from '$lib/utils';

    type Props = {
	data?: ElectricRoom,
	class?: string
	} & NodeProps<Node<ElectricRoom>>
    let { id, data, class: className, type, ...rest }: Props = $props();

    let selectedNodes = $state<string[]>([]);

    useOnSelectionChange(({nodes})=>{
	const selection = nodes.filter(n=>n.selected);
	selectedNodes = selection.map(n=>n.id);
    });

    let selected = $derived.by(()=>selectedNodes.length > 0 && selectedNodes.every(item=>item == id));
    let resizeable = $state(false);
    let content: HTMLDivElement | undefined = $state();

    let resizeProps = $state({
	minWidth: Flow.dimensions[type].width,
	minHeight: Flow.dimensions[type].height,
	maxWidth: 128,
	maxHeight: 128,
    });

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

useResizeObserver(()=>content, ([info])=>{
    if (!content || !info) return;
    resizeProps.minWidth = clamp(info.contentRect.width, content.scrollWidth , resizeProps.maxWidth)+8;
    resizeProps.minHeight = clamp(info.contentRect.height, content.scrollHeight, resizeProps.maxHeight)+8;
});


    id = id || data?.id.toString();


    let editName = $state(false);
    let name = $state(data?.name);

    const viewport = useViewport();
    const flow = useSvelteFlow();
    const node = useInternalNode(id);

    function ondblclick(e: MouseEvent) {
	e.stopPropagation();
	if (!node) return;
	flow.fitBounds(flow.getNodesBounds([node.current!]),{ padding: .1 });
    }

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

    let zoom = $derived(viewport.current.zoom > 1);

    const onfocus = (e: FocusEvent &{ currentTarget: EventTarget & HTMLInputElement})=>e.currentTarget.select()
    // isConnectable = false; // always false for groups
    // TODO: validate data by schema here or on fetch?
</script>
<div {ondblclick} bind:this={content} transition:fade class="room size-full" role="list">
    <NodeResizer {...resizeProps} isVisible={selected && resizeable}  class="rounded-lg" nodeId={id} />
    {#if !zoom}
	<NodeToolbar class="text-slate-500" offset={0}  position={Position.Top} align="start" nodeId={id}>
	    <CustomControlButton type="button" class="hover:text-orange-400" title="Edit board" onclick={ondblclick}>
		<span class="icon-[solar--pen-new-round-bold-duotone]"></span>
	    </CustomControlButton>
	</NodeToolbar>
	<div class="flex flex-row text-center justify-center items-center w-full h-full">
	    <p class="font-bold text-5xl text-slate-400">{name}</p>
	</div>
    {:else}
	<NodeToolbar class="text-slate-500 h-full"  position={Position.Right} align="start" nodeId={id}>
	    <div class="flex flex-col gap-1 *:rounded-lg" transition:fade>
		<ControlButton title="Add board" onclick={()=>console.log("click")}>
		    <span class="icon-[material-symbols--add-2-rounded]"></span>
		</ControlButton>
		<ControlButton {...resizeControlProps} type="button" onclick={()=>resizeable=!resizeable}>
		    <span class="icon-[material-symbols--resize-rounded]"></span>
		</ControlButton>
	    </div>
	</NodeToolbar>
	<NodeToolbar class="text-slate-500" offset={-4}  position={Position.Top} align="center" nodeId={id}>
	    {#if editName}
		<!-- svelte-ignore a11y_autofocus -->
		<input autofocus {onfocus} class="w-full text-lg focus:bg-yellow-50 text-slate-500 bg-transparent" bind:value={name} onblur={()=>editName=false}>
	    {:else}
		<p ondblclick={()=>{editName=true}} class="font-bold text-lg text-slate-500">{name}</p>
	    {/if}
	</NodeToolbar>
	<NodeToolbar class="text-slate-500" offset={-5}  position={Position.Bottom} align="start" nodeId={id}>
	    <p class="font-extralight italic size-auto">{data?.id}</p>
	</NodeToolbar>
    {/if}
</div>
<style>
.room {
    font-size: 10px;
    color: var(--xy-node-group-background-color-default, var(--xy-node-group-background-color-default));
    text-align: left;
}
:global(.svelte-flow__node-electric_rooms.selectable) {
    padding: 10px;
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

</style>
