<script module>
import { SvelteMap } from "svelte/reactivity";
import { writable } from "svelte/store";

export const resizer = writable(new SvelteMap<string, boolean>());
export const client_nodes = writable<Node[]>([]);
export const client_edges = writable<Edge[]>([]);
</script>

<script lang="ts">
import type { ELK } from 'elkjs/lib/elk-api';

import { Uuid } from 'surrealdb';
import { twMerge } from 'tailwind-merge';
import {
    useSvelteFlow,
    useNodesInitialized,
    SvelteFlow,
    Panel,
    Controls,
    Background,
    BackgroundVariant,
    type SvelteFlowProps,
    type Node,
    type Edge,
    type ColorMode,
    useOnSelectionChange,
} from '@xyflow/svelte';
import { toast } from "svelte-sonner";
import Button from '$lib/components/Button.svelte';

// INFO: custom node types use global css class for styling
// each node wrapper has class "svelte-flow__node-{type}"
// where "type" is key from this table
// make sure keys in utls match styles in respective node component

import { Flow } from '$lib/utils';
import Toolbar  from './Toolbar.svelte';
import { untrack } from "svelte";

let { nodes=$bindable([]), edges=$bindable([]), colorMode=$bindable("system") }: SvelteFlowProps & { elk: ELK | null } = $props();

let dbNodes: Node[] = $state.raw(nodes);
let dbEdges: Edge[] = $state.raw(edges || []);
const { fitView, getZoom, updateNode, getNodes } = useSvelteFlow();

const zoom = $derived.by(getZoom);
const isHidden = $derived(zoom<1);


const boards = $derived.by(getNodes);
$effect(()=>{
    if (useNodesInitialized().current) {
        untrack(()=>{
            boards.filter(n=>n.type == "breakers" || n.type == "unsaved_breakers")
            .forEach(n=>{
                n.hidden = isHidden;
                $effect.pre(()=>updateNode(n.id,{ hidden: isHidden }));
            });
        });
    }
});

async function onLayout() {
    try {

        // const withLayout = await layout(dbNodes, edges, options);
        // dbNodes = withLayout.nodes
        // edges = withLayout.edges

        fitView();
    } catch (e: any) {
        toast.error(e.message);
    }
}

let once = true;
$effect.pre(() => {
    if(useNodesInitialized().current && once) {
        // onLayout();
        once = false;
    }
});


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


let selectedNodesIds = $state<string[]>([]);
let selectedNodes = $state<Node[]>([]);

useOnSelectionChange(({nodes})=>{
    selectedNodesIds = nodes.map(n=>n.id);
    selectedNodes = nodes;
});

let selectionReady = $state(true);
async function oninit() {
    dbNodes.forEach(n=>$resizer.set(n.id, false));
    // onLayout();
}

function onflowerror(e: any) {
    console.error(e);
    toast.error("Flow error: "+e);
}
</script>

<SvelteFlow
    proOptions={{hideAttribution: true}}
    {oninit}
    {onflowerror}
    onselectionend={()=>{selectionReady = true}}
    onselectionstart={()=>{selectionReady = false}}
    selectionOnDrag
    panOnDrag={[1]}
    nodes={dbNodes}
    edges={dbEdges}
    {colorMode}
    nodeTypes={Flow.nodeTypes}
    edgeTypes={Flow.edgeTypes}
    minZoom={0.1}
    maxZoom={99}
    snapGrid={[5, 5]}
    nodeDragThreshold={20}
>
    <Toolbar ready={selectionReady}  />
    <Controls position="top-right"  />
    <Panel class="bg-transparent p-1 flex flex-row gap-2 justify-center items-center w-auto h-fit" position="bottom-center">
        <Button onclick={()=>onLayout()}>
            {#snippet children()}
                <span class="text-amber-600 size-6 icon-[material-symbols--responsive-layout-outline-rounded]"></span>
                <div class="size-auto">layout?</div>
            {/snippet}
        </Button>
    </Panel>
    <Panel class="bg-transparent p-1 flex flex-row gap-2 justify-center items-center w-auto h-fit" position="bottom-right">
        <Button title="Update db" --color="var(--color-rose-400)" class="hover:bg-rose-200 hover:text-rose-500" onclick={()=>console.log(dbNodes)}>
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
