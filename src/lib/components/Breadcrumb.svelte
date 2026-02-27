<script lang="ts">
import { watch } from 'runed';
import { twMerge } from 'tailwind-merge';
import { type Node, useOnSelectionChange, useNodes, useSvelteFlow } from '@xyflow/svelte';
import * as Breadcrumb from '$lib/components/ui/breadcrumb';
import * as Dropdown from '$lib/components/ui/dropdown-menu';

import { CrumbBuilder } from '$lib/client/bredcrumb.svelte';
let {} = $props();
const cb = new CrumbBuilder();
$inspect(cb.by_type);
const breakerTypes = ['breakers', 'unsaved_breakers', 'root_breakers', 'unsaved_root_breakers'];
const boardTypes = ['boards', 'unsaved_boards'];
const roomTypes = ['electric_rooms', 'unsaved_electric_rooms'];

const nodes = $derived(useNodes().current);
const { getNode, fitView } = useSvelteFlow();

let selected: Node[] = $state([]);
useOnSelectionChange(({ nodes }) => {
    selected = nodes;
    cb.selection = nodes;
});

let all_grouped: Array<Array<Node>> = $derived.by(() => {
    return [
	nodes.filter((n) => roomTypes.includes(n.type!)),
	nodes.filter((n) => boardTypes.includes(n.type!)),
	nodes.filter((n) => breakerTypes.includes(n.type!))
    ];
});

let selected_grouped: Array<Array<Node>> = $state([[], [], []]);
let italics: Array<"italics" | ""> = $derived.by(()=>selected_grouped.map((items)=>items.length>1?"italic":""));
watch(
    () => selected,
    (current, prev) => {
	if (current.length == 0) {
	    selected_grouped = [[], [], []];
	    return;
	}

	selected_grouped[0] = current.filter((n) => roomTypes.includes(n.type));
	selected_grouped[1] = current.filter((n) => boardTypes.includes(n.type));
	selected_grouped[2] = current.filter((n) => breakerTypes.includes(n.type));
	return () => {
	    selected_grouped = [[], [], []];
	};
    });
const titles = $derived.by(() => {
    const default_title = ['Помещения', 'Щиты', 'Автоматы'];
    return selected_grouped.map((item, idx) => {
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
</script>

<Breadcrumb.Root>
    <Breadcrumb.List>
	{#each all_grouped as list, idx}
	    <Breadcrumb.Item>
		<Dropdown.Root>
		    <Dropdown.Trigger class="flex flex-row">
			<p class={twMerge(italics[idx])}>{titles[idx]}</p>
			<span class="mt-auto icon-[solar--arrow-to-down-left-line-duotone] size-4"></span>
		    </Dropdown.Trigger>
		    <Dropdown.Content>
			{@const by_parent = Object.entries(Object.groupBy(list,(item)=>item.parentId))}
			{#each by_parent as item, i}
			    <Dropdown.Group>
				{@const label = getNode(item[0])?.data?.name}
				{#if label}
				    <Dropdown.Label>{label}</Dropdown.Label>
				{/if}
				{#each item[1] as val}
				    <Dropdown.Item onclick={()=>fitView({nodes:[val], duration: 1000, padding: 1})} class="pl-4">{val.data.name}</Dropdown.Item>
				{/each}
				{#if i != by_parent.length-1}
				    <Dropdown.Separator />
				{/if}
			    </Dropdown.Group>
			{/each}
		    </Dropdown.Content>
		</Dropdown.Root>
	    </Breadcrumb.Item>
	    {#if idx != all_grouped.length-1}
		<Breadcrumb.Separator />
	    {/if}
	{/each}
    </Breadcrumb.List>
</Breadcrumb.Root>
