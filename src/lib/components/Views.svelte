<script lang="ts">
	import { goto } from '$app/navigation';
import { page } from '$app/state';
import * as Nav from '$lib/components/ui/navigation-menu/index';
import type { LayoutData } from '../../routes/$types';

let { views, ...rest }: { views: LayoutData["views"] } = $props();
const current_view_href = $derived(page.url.pathname);
</script>

{#each Object.values(views) as view}
	{#if view.href == current_view_href}
		<Nav.Item>
			<Nav.Link class="bg-accent font-bold"  >{view.name}</Nav.Link>
		</Nav.Item>
	{:else}
		<Nav.Item>
			<Nav.Link href={view.href} onclick={()=>{console.log("CLICK", view.href); goto(view.href, { invalidate: [view.href] }) }}>{view.name}</Nav.Link>
		</Nav.Item>
	{/if}
{/each}
