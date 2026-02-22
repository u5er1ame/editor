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
    useConnection,
    useOnSelectionChange,
    getIncomers,
    getConnectedEdges,
    addEdge,
    useEdges,
    SvelteFlow,
    Panel,
    Controls,
    Background,
    BackgroundVariant,
    type OnConnect,
    type OnConnectEnd,
    type SvelteFlowProps,
    type Node,
    type Edge,
    type ColorMode,
	type IsValidConnection,
	type OnBeforeConnect,
	type EdgeTypes,
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
	import type { EdgeBase } from "@xyflow/system";

const connection = $derived(useConnection().current);

let { nodes=$bindable([]), edges=$bindable([]), colorMode=$bindable("system") }: SvelteFlowProps & { elk: ELK | null } = $props();

let dbNodes: Node[] = $state.raw(nodes);
let dbEdges: Edge[] = $state.raw(edges || []);

const { fitView, getZoom, getNode, updateNode, getNodes, getEdges } = useSvelteFlow();
const edgesStore = useEdges();

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

let lastEdge: Edge | null = $state(null);

const onbeforeconnect: OnBeforeConnect = (c) => {
    console.log("before connect");
    if (getNode(c.source)?.parentId == getNode(c.target)?.parentId) {
        console.log("inbound");
        return { ...c, type: "straight", animated: true };
    }
    else {
        console.log("outbound");
        return { ...c, type: "bezier", animated: true };
    }
}

const onconnect: OnConnect = (c) => {
        console.log("connect", c);
}


const onconnectend: OnConnectEnd = (e, c) => {
    console.log("connect end", c);
    // const edge = getEdge(c.id);
    // const updated = addEdge(c, edgesStore.current);
    // edgesStore.set(updated)
    // if (c.isValid) {
    //     console.log("connected", e, c);
    // }
}

const isValidConnection : IsValidConnection = (e) => {
    if (e.source == e.target) {
        return false;
    }
    const through = getConnectedEdges(getNodes(), getEdges())
        // .filter(n => n.id == e.source)
    // console.log(through);
    // if (through.length > 0) {
    //     return false;
    // }
    return true;
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
    {onconnect}
    {onbeforeconnect}
    {onconnectend}
    {isValidConnection}
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
