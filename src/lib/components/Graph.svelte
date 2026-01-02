<script lang="ts">
import { error } from '@sveltejs/kit';
import {
    useSvelteFlow,
    type OnConnectEnd,
    SvelteFlow,
    Panel,
    Controls,
    Background,
    BackgroundVariant,
    type SvelteFlowProps,
    type Node,
    type Edge,
    type ColorMode,
} from '@xyflow/svelte';

import ELK from "elkjs/lib/elk.bundled.js";

import Button from '$lib/components/Button.svelte';

// INFO: custom node types use global css class for styling
// each node wrapper has class "svelte-flow__node-{type}"
// where "type" is key from this table
// make sure keys in this table match styles in respective node component
import { Flow } from '$lib/utils';

let { nodes=$bindable([]), edges=$bindable([]), colorMode=$bindable("system") }: SvelteFlowProps = $props();
const elk = new ELK();
console.log("nodes", nodes);
const { fitView } = useSvelteFlow();

async function layout(nodes: Node[],edges: Edge[], options: any) {
    if (!elk) return { nodes, edges };
    const graph = {
        id: 'root',
        children: nodes.map((node)=>{
            if (node.parentId) {
            }
            return ({
                id: node.id,
                width: node.measured?.width ,
                height: node.measured?.height,
                x: node.position?.x || 0,
                y: node.position?.y || 0,
                padding: 10,
                data: node.data,
            })
        }) as ElkNode[],
        // edges: edges.map((edge)=>({
        //     id: edge.id,
        //     source: edge.source,
        //     target: edge.target,
        // })) as ElkExtendedEdge[],
        edges: edges as unknown as ElkExtendedEdge[] // TODO: fix type
    };
    const elkGraph = await elk.layout(graph);
    const layoutedNodes = nodes.map((node)=>{
        const elkNode = elkGraph?.children?.find(n=>n.id === node.id);
        if (!elkNode) return node;
        return {
            ...node,
            position: {
                x: elkNode.x,
                y: elkNode.y,
            },
        };
    });
    return { nodes: layoutedNodes, edges };
}

import type { ElkExtendedEdge, ElkNode } from 'elkjs';
import { Uuid } from 'surrealdb';
import { twMerge } from 'tailwind-merge';
async function onLayout() {
    try {
        let options = {
            "elk.algorithm": "layered",
            "elk.direction": "RIGHT",
            // "elk.layered.spacing.nodeNodeBetweenLayers": defaultSize.width/8,
            // "elk.spacing.nodeNode": defaultSize.width/8,
        };
        const withLayout = await layout(nodes, edges, options);
        nodes = withLayout.nodes
        edges = withLayout.edges
        fitView();
    } catch (e: any) {
        error(400, e.message);
    }
}

const { screenToFlowPosition } = useSvelteFlow();

const onconnectend: OnConnectEnd = (event, state) => {
    if (state.isValid)  return;
    const { clientX, clientY } = 'changedTouches' in event ? event.changedTouches[0] : event;
    const parent = state.fromNode?.parentId
    console.log("empty connect!", parent);
    // TODO: handle out of group case
}




async function testRoom() {
    const id = Uuid.v4().toString();
    console.log("add room", id);
    nodes.push({
        id,
        type: 'electric_rooms',
        data: { id, name: 'щ 69' },
        position: { x: 0, y: 0 }
    });
    await onLayout();
}

type Theme = { mode: ColorMode, icon: string };
const themes: Theme[] = [
    { mode: "system", icon: "icon-[material-symbols--computer-outline-rounded]" },
    { mode: "light", icon: "icon-[material-symbols--light-mode-outline-rounded]" },
    { mode: "dark", icon: "icon-[material-symbols--dark-mode-outline-rounded]" }
];
let themeIdx = $state(0);

function toggleColorMode() {
    themeIdx =  (themeIdx + 1) % themes.length;
}

$effect(() => {
    colorMode = themes[themeIdx].mode;
});
</script>

<SvelteFlow
    proOptions={{hideAttribution: true}}
    {nodes}
    {edges}
    {colorMode}
    nodeTypes={Flow.nodeTypes}
    maxZoom={4}
    snapGrid={[5, 5]}
>
    <Controls position="top-right"  />
    <Panel class="bg-transparent p-1 flex flex-row gap-2 justify-center items-center w-auto h-fit" position="bottom-center">
        <Button class="text-emerald-600"  onclick={()=>testRoom()}>
            {#snippet children()}
                <span class="text-emerald-600 size-6 icon-[material-symbols--add-2-rounded]"></span>
                <div class="size-auto">Add Room</div>
            {/snippet}
        </Button>
        <Button onclick={()=>onLayout()}>
            {#snippet children()}
                <span class="text-amber-600 size-6 icon-[material-symbols--responsive-layout-outline-rounded]"></span>
                <div class="size-auto">layout?</div>
            {/snippet}
        </Button>
    </Panel>
    <Panel class="bg-transparent p-1 flex flex-row gap-2 justify-center items-center w-auto h-fit" position="bottom-right">
        <Button title="Update db" --color="var(--color-rose-400)" class="hover:bg-rose-200 hover:text-rose-500" onclick={()=>console.log("click")}>
            {#snippet children()}
                <span class="size-6 icon-[material-symbols--database-upload-outline-rounded]"></span>
            {/snippet}
        </Button>
    </Panel>
    <Panel class="bg-transparent p-1 flex flex-row gap-2 justify-center items-center w-auto h-fit" position="top-left">
        <Button title={themes[themeIdx].mode+" mode"} onclick={()=>{toggleColorMode(); }}>
            {#snippet children()}
                <span class={twMerge("size-6", themes[themeIdx].icon)}></span>
            {/snippet}
        </Button>
    </Panel>
    <Background size={1} variant={BackgroundVariant.Dots} />
</SvelteFlow>
