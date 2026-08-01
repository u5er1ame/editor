import type { Snippet } from "svelte";
import { get } from "svelte/store";
import { watch } from "runed";
import { type Node, useSvelteFlow, type ControlButtonProps, useNodes } from "@xyflow/svelte";
import { type Controls } from "$lib/client/toolbar.svelte";
import { DumbButton, Lock, Selectable, ResizeButton } from "$lib/client/snippets.svelte";
import type { SvelteMap } from "svelte/reactivity";
import { resizer } from "$lib/utils";


export type MultiState = "all" | "partial" | "none"
export type DuoState = boolean

export class ToolbarItem implements Controls {
	item: Snippet<[ControlButtonProps]> = DumbButton
	type: string
	prio?: number = 5
	props: ControlButtonProps & any = $state({});
	condition?: () => boolean;

	constructor({ item, type, prio, props, condition }: Controls) {
		this.item = item;
		this.type = type;
		this.prio = prio;
		this.props = props;
		this.condition = condition;
	}
}


export abstract class SelectedNodesControl extends ToolbarItem {
	store = useNodes();
	flowHook = useSvelteFlow();

	nodes: string[] = $state([]);
	abstract onSelectionChange: (cur: string[], prev: string[]) => void;

	abstract multistate?: MultiState
	abstract bistate?: DuoState
	abstract onStateChange: (cur?: MultiState | DuoState, prev?: MultiState | DuoState) => void

	abstract partitionFilter?: (item: Node)=> boolean;

	static state2any(state: MultiState, dragabble: any, locked: any, partial: any) {
		switch (state) {
			case "all": return dragabble;
			case "none": return locked;
			case "partial": return partial;
			default: return dragabble;
		}
	}
	perState(all: any, none: any, partial: any) {
		if (this.multistate == undefined) return;
		switch (this.multistate) {
			case "all": return all;
			case "none": return none;
			case "partial": return partial;
			default: return all;
		}
	}

	update(nodes: Node[]) {
		this.nodes = nodes.map(n => n.id);
	}

	constructor(opts: Controls) {
		super(opts);
	}
}

type BooleanKeys<Node> = {
  [K in keyof Node]: Node[K] extends boolean ? K : never;
}[keyof Node]

export class PropertyControl extends SelectedNodesControl {
	multistate: MultiState = $state(this.checkState(this.nodes));
	property: BooleanKeys<Node>
	constructor(opts: ToolbarItem & { property: BooleanKeys<Node> }) {
		super(opts);
		this.props = {}
		this.property = opts.property;
		watch(() => this.nodes, this.onSelectionChange);
		// watch(() => this.multistate, this.onStateChange );
	}
	// 	this.props.title = this.perState("Lock movement", "Unlock movement", "Swap state")
	// 	this.props.color = this.perState("var(--color-sky-400)", "var(--color-red-500)", "var(--color-yellow-500)")
	// 	this.props.style = this.perState(undefined, "border: 2px solid var(--color-red-500)", "border: 1px dashed var(--color-yellow-500)")
	// }
	onSelectionChange = (cur?: string[], _pre?: string[]) => {
		if(cur == undefined) return;
		this.multistate = this.checkState(cur);
		this.props.onclick = (e: MouseEvent) => {
			e.stopPropagation();
			let nodes = this.flowHook.getNodes(cur);
			for (const node of nodes) {
				const property = node[this.property] ?? true; // INFO: prevent !undefined ?? false == true
				this.flowHook.updateNode(node.id, () => ({ [this.property]: !property }));
			}
			this.multistate = this.checkState(cur);
		}
	}
	partitionFilter = (_item: Node)=> true;


	checkState(ids: string[]): MultiState {
		let out: MultiState = "all";
		if (ids.length == 0) return out;
		const nodes = this.store.current.filter((n) => ids.includes(n.id));
		if (nodes.every((n) => n[this.property] ?? true)) out = "all";
		else if (nodes.some((n) => n[this.property] ?? true)) out = "partial";
		else out = "none";
		return out;
	}
}

export class DragControl extends PropertyControl {
	constructor(opts: Pick<ToolbarItem, "condition">) {
		super(opts);
		this.item = Lock;
		this.type = "lock";
		this.prio = 3;
		this.property = "draggable";
		watch(() => this.multistate, this.onStateChange );
	}
	onStateChange = (_cur?: MultiState, _pre?: MultiState) => {
		this.props.title = this.perState("Lock movement", "Unlock movement", "Swap state")
		this.props.color = this.perState(undefined, "var(--color-red-500)", "var(--color-yellow-500)")
		this.props.style = this.perState(undefined, "border: 2px solid var(--color-red-500)", "border: 1px dashed var(--color-yellow-500)")
	}
}

export class SelectableControl extends PropertyControl {
	constructor(opts: Pick<ToolbarItem, "condition">) {
		super(opts);
		this.item = Selectable;
		this.type = "selectable";
		this.property = "selectable";
		this.prio = 7;
		watch(() => this.multistate, this.onStateChange );
	}
	onStateChange = (_cur?: MultiState, _pre?: MultiState) => {
		this.props.title = this.perState("Disable Selection (!)", "Enable Selection (!)", "Swap state")
		this.props.color = this.perState("var(--color-orange-700)", "var(--color-yellow-500)", "var(--color-yellow-500)")
		this.props.bgColorHover = this.perState("var(--color-red-500)", "var(--color-red-500)", "var(--color-yellow-500)")
		this.props.style = this.perState(undefined, "border: 2px solid var(--color-red-500)", "border: 1px dashed var(--color-yellow-500)")
	}
}

export class ResizeControl extends SelectedNodesControl {
	bistate: DuoState = $state(false);
	constructor(opts: Pick<ToolbarItem, "condition">) {
		super(opts);
		this.item = ResizeButton;
		this.type = "resizer";
		this.prio = 0;
		this.props = {
			// title: "Enable resizing",
			// color: get(resizer).get(this.nodes[0])?"var(--color-sky-400)":"var(--color-red-500)",
			title : this.bistate?"Disable resizing": "Enable resizing",
			color : this.bistate?undefined: "var(--color-orange-500)",
			bgColorHover : this.bistate?undefined: "var(--color-orange-500)",
			style : this.bistate?"border: 2px solid var(--color-orange-500)": "border: 1px dashed var(--xy-controls-button-color-default)",
			onclick: ()=>{
				if (this.nodes.length != 1) return;
				const map: SvelteMap<string, boolean> = get(resizer);
				const value = map.get(this.nodes[0])
				map.set(this.nodes[0], !map.get(this.nodes[0]))
				resizer.set(map);
				this.bistate = !this.bistate
			},
		},
		watch(() => this.bistate, this.onStateChange );
		watch(() => this.nodes, this.onSelectionChange );
	}
	onStateChange = (cur?: DuoState, _pre?: DuoState) =>{
		if (cur == undefined) return
		this.props.active = cur
		this.props.title = cur?"Disable resizing": "Enable resizing"
		this.props.color = cur?"var(--color-orange-500)":undefined
		this.props.bgColorHover = cur?"var(--color-orange-500)":undefined
		this.props.style = cur?"border: 2px solid var(--color-orange-500)": "border: 1px dashed var(--xy-controls-button-color-default)"
	}
	onSelectionChange = (cur: string[], prev: string[]) => {
		if (cur.length != 1) return;
		this.props.title = this.bistate?"Disable resizing": "Enable resizing"
		this.props.color = this.bistate?"var(--color-orange-500)":undefined
		this.props.bgColorHover = this.bistate?"var(--color-orange-500)":undefined
		this.props.style = this.bistate?"border: 2px solid var(--color-orange-500)": "border: 1px dashed var(--xy-controls-button-color-default)"
		this.bistate = get<SvelteMap<string, boolean>>(resizer).get(cur[0]) || false
		if (this.bistate == undefined) { console.log("undef"); this.bistate = false; }
	}
}
