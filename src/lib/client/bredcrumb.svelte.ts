import { useNodes, type Node } from "@xyflow/svelte";
import { watch } from "runed";
import { SvelteSet } from "svelte/reactivity";

const breakerTypes = ['breakers', 'unsaved_breakers', 'root_breakers', 'unsaved_root_breakers'];
const boardTypes = ['boards', 'unsaved_boards'];
const roomTypes = ['electric_rooms', 'unsaved_electric_rooms'];

export type Group = {
	label?: string,
	items: Array<string>
}
export function groupBy(items: Array<Node>, key?: string) {
	let lookup = new Map<string, Set<string>>();
	key = key || "type";
	for (const item of items) {
		if (item[key] == undefined) {
			continue; // FIXME: just skip...for now
		}
		const stored = lookup.get(item[key]);
		if (stored == undefined) {
			lookup.set(item[key], new Set([item.id]));
			continue;
		}
		if (stored.has(item.id)) {
			continue;
		}
		else {
			stored.add(item.id);
		}
		continue;
	}
	return lookup;
}

export class CrumbBuilder {
	all_nodes: Array<Node> = $derived(useNodes().current);
	by_type: Record<string, Array<Node>> = $derived(Object.groupBy(this.filtered_by_selection, (item)=>item.type!));
	selection: Array<Node> = $state([]);
	selection_grouped: Array<Array<Node>> = $state([[], [], []]);
	filter_grouped: Array<Array<Node>> = $state([[], [], []]);
	italics: Array<"italic" | ""> = $derived.by(() => this.selection_grouped.map((items) => items.length > 1 ? "italic" : ""));
	filtered_by_selection: Array<Node> = $derived.by(() => {
		if (this.selection.length == 0) {
			return this.all_nodes;
		}
		const all_childs: Array<SvelteSet<Node>> = $state([new SvelteSet()]);
		for (const items of this.selection) {
			const childs = this.getAllChilds(items);
			if(childs) all_childs.push(childs);
		}
		return all_childs.reduce((a,i)=>{
			a = a.union(i);
			return a;
		}).values().toArray();
	});
	titles = $derived.by(() => {
		const default_title = ['Помещения', 'Щиты', 'Автоматы'];
		return this.selection_grouped.map((item, idx) => {
		if (item.length == 0) {
			return default_title[idx];
		}
		if (item.length > 1) {
			return 'выбрано ' + item.length;
		} else {
			return item[0].data.name;
		}
		});
	});
	constructor() {
		watch(
			() => this.selection,
			(current, prev) => {
				if (current.length == 0) {
					this.selection_grouped = [[], [], []];
					return;
				}

				this.selection_grouped = [
					current.filter((n) => roomTypes.includes(n.type!)),
					current.filter((n) => boardTypes.includes(n.type!)),
					current.filter((n) => breakerTypes.includes(n.type!))
				]
			});
		watch(
			() => this.filtered_by_selection,
			(current, prev) => {
				if (current.length == 0) {
					this.selection_grouped = [[], [], []];
					return;
				}

				this.filter_grouped = [
					current.filter((n) => roomTypes.includes(n.type!)),
					current.filter((n) => boardTypes.includes(n.type!)),
					current.filter((n) => breakerTypes.includes(n.type!))
				]
			});
	}

	getChilds(node: Node) {
		return useNodes().current.filter((n) => n.parentId == node.id);
	}
	getAllChilds(node: Node) {
		const out = new SvelteSet<Node>([node]);
		function getCh(parent: Node) {
			const childs = useNodes().current.filter((n) => n.parentId == parent.id);
			if (childs.length == 0) {
				return;
			}
			else {
				childs.forEach((item)=>{
					out.add(item);
					getCh(item);
				});
			}
		}
		getCh(node);
		return out;
	}
}
