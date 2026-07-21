<script lang="ts">
	import { goto } from '$app/navigation';
import { page } from '$app/state';
import * as Nav from '$lib/components/ui/navigation-menu/index';
import type { LayoutData } from '../../routes/$types';

let { views, ...rest }: { views: LayoutData["views"] } = $props();
const current_view_href = $derived(page.url.pathname);
</script>

{#each Object.values(views) as view}
		<Nav.Item>
	{#if view.href == current_view_href}
			<Nav.Link data-active={true} class="ring font-bold"  >{view.name}</Nav.Link>
	{:else}
			<Nav.Link href={view.href} onclick={()=>{console.log("CLICK", view.href); goto(view.href, { invalidate: [view.href] }) }}>{view.name}</Nav.Link>
	{/if}
		</Nav.Item>
{/each}
