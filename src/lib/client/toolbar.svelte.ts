import { type Node, useSvelteFlow, type ControlButtonProps, type Edge } from "@xyflow/svelte";
import { Position, type Align, type Rect } from "@xyflow/svelte";
import type { Snippet } from "svelte";

import { DeleteButton, FitViewButton, } from "$lib/client/snippets.svelte";
import { SvelteMap } from "svelte/reactivity";

export interface Controls {
	type: string,
	item: Snippet<[ControlButtonProps]>,
	prio?: number, // l2r order of controls default: 5
	props?: ControlButtonProps | any,
	condition?: () => boolean,
	update?: (nodes: Node[]) => void
}

export class Toolbar {
	flowHook = useSvelteFlow();
	selectedNodes: Node[] = $state([]);
	selectionBounds: Rect = $derived(this.flowHook.getNodesBounds(this.selectedNodes));
	isVisible: boolean = $derived(this.selectedNodes.length > 0);
	nodeId: string[] = $derived(this.selectedNodes.map(n => n.id));
	align: Align = $derived.by(() => this.selectedNodes.length > 0 ? "center" : "end");
	position: Position = $derived.by(() => this.selectedNodes.length > 1 ? Position.Bottom : Position.Bottom);

	constructor() {
		this.defaultControls.forEach(control => this.addControl(control));
	}

	update(nodes: Node[], edges: Edge[]) {
		this.selectedNodes = nodes;
		this.availableControls.forEach((c) => { if (c.update) c.update(nodes) }); // TODO: temporary
	}

	addControl(control: Controls) {
		this.controls.set(control.type, control);
	}

	getNodeTypes() {
		return this.selectedNodes.map(n => n.type);
	}

	getNodeIds() {
		return this.nodeId;
	}

	controls: SvelteMap<string, Controls> = new SvelteMap();

	defaultControls = [
		{
			item: FitViewButton,
			type: "fit",
			prio: 1,
			props: {
				title: "Fit view",
				onclick: (_: MouseEvent) => { this.flowHook.fitView({ duration: 200, padding: "8px", nodes: this.selectedNodes }) }
			},
		},
		{
			item: DeleteButton,
			type: "deleteitem",
			prio: 99,
			props: {
				title: "Delete",
				bgColorHover: "var(--color-rose-400)",
				onclick: (_: MouseEvent) => {		// TODO: delete
					console.log("delete handler");
				}
			},
			condition: () => this.selectedNodes.some((n) => n.deletable ?? true)
		}
	];

	availableControls: Controls[] = $derived.by(() => {
		const controls = this.controls.values();
		return controls.filter(c => c.condition?.() ?? true).toArray()
	});

}
