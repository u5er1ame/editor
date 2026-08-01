<script lang="ts">
import { twMerge } from 'tailwind-merge';
import { type Node, useOnSelectionChange, useNodes, useSvelteFlow } from '@xyflow/svelte';
import * as Breadcrumb from '$lib/components/ui/breadcrumb';
import * as Dropdown from '$lib/components/ui/dropdown-menu';
import { CrumbBuilder } from '$lib/client/bredcrumb.svelte';
	import { tick } from 'svelte';


let {} = $props();

const { getNode, fitView, updateNode } = useSvelteFlow();

const nodes = $derived.by(useNodes);
const cb = new CrumbBuilder();

useOnSelectionChange(({ nodes }) => {
    cb.selection = nodes;
});

function setSelection(node: Node) {
    const desel = nodes.current.filter((n)=>n.id != node.id)
    desel.forEach((n)=>updateNode(n.id, {selected: false}));
    updateNode(node.id, {selected: true}); // INFO: just in case if selection is empty
    fitView({nodes:[node], duration: 1000, padding: 1});
}

</script>

<Breadcrumb.Root>
    <Breadcrumb.List>
	{#each cb.filter_grouped as list, idx}
	    {#if list.length != 0}
		<Breadcrumb.Item>
		    {#if list.length == 1}
			<button onclick={()=>setSelection(list[0])} class={twMerge(cb.italics[idx], "cursor-pointer text-active")}>{cb.titles[idx]}</button>
		    {:else}
		    <Dropdown.Root>
			<Dropdown.Trigger class="flex flex-row text-foreground cursor-pointer">
			    <p class={twMerge(cb.italics[idx])}>{cb.titles[idx]}</p>
			    <span class="mt-auto icon-[solar--arrow-to-down-left-line-duotone] size-4"></span>
			</Dropdown.Trigger>
			<Dropdown.Content>
			    {@const by_parent = Object.entries(Object.groupBy(list,(item: Node)=>item.parentId))}
			    {#each by_parent as item, i}
				<Dropdown.Group>
				    {@const node = getNode(item[0])}
				    {@const label = node?.data?.raw[node?.data.labelKey]}
				    {#if label}
					<Dropdown.Label>{label}</Dropdown.Label>
				    {/if}
				    {#each item[1] as val}
					<Dropdown.Item onclick={()=>setSelection(val)} class="pl-4">{val.data.raw[val.data.labelKey]}</Dropdown.Item>
				    {/each}
				    {#if i != by_parent.length-1}
					<Dropdown.Separator class="text-accent" />
				    {/if}
				</Dropdown.Group>
			    {/each}
			</Dropdown.Content>
		    </Dropdown.Root>
		    {/if}
		</Breadcrumb.Item>
		{#if idx != cb.filter_grouped.length-1}
		    <Breadcrumb.Separator class="text-accent"/>
		{/if}
	    {/if}
	{/each}
    </Breadcrumb.List>
</Breadcrumb.Root>
