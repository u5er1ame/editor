<script lang="ts">
import { watch } from 'runed';
import { twMerge } from 'tailwind-merge';
import { type Node, useOnSelectionChange, useNodes, useSvelteFlow } from '@xyflow/svelte';
import * as Breadcrumb from '$lib/components/ui/breadcrumb';
import * as Dropdown from '$lib/components/ui/dropdown-menu';
import { CrumbBuilder } from '$lib/client/bredcrumb.svelte';


let {} = $props();

const { getNode, fitView } = useSvelteFlow();

const cb = new CrumbBuilder();

useOnSelectionChange(({ nodes }) => {
    cb.selection = nodes;
});

</script>

<Breadcrumb.Root>
    <Breadcrumb.List>
	{#each cb.filter_grouped as list, idx}
	    <Breadcrumb.Item>
		{#if list.length == 1}
		    <button onclick={()=>fitView({nodes:list, duration: 1000, padding: 1})} class={twMerge(cb.italics[idx], "cursor-pointer")}>{cb.titles[idx]}</button>
		{:else}
		<Dropdown.Root>
		    <Dropdown.Trigger class="flex flex-row cursor-pointer">
			<p class={twMerge(cb.italics[idx])}>{cb.titles[idx]}</p>
			<span class="mt-auto icon-[solar--arrow-to-down-left-line-duotone] size-4"></span>
		    </Dropdown.Trigger>
		    <Dropdown.Content>
			{@const by_parent = Object.entries(Object.groupBy(list,(item: Node)=>item.parentId))}
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
		{/if}
	    </Breadcrumb.Item>
	    {#if idx != cb.filter_grouped.length-1}
		<Breadcrumb.Separator />
	    {/if}
	{/each}
    </Breadcrumb.List>
</Breadcrumb.Root>
