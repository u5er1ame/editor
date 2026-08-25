<script lang="ts">
import { goto } from '$app/navigation';
import { page } from '$app/state';
import * as Nav from '$lib/components/ui/navigation-menu/index';
import type { LayoutData } from '../../routes/$types';
import * as m from '$lib/paraglide/messages.js';

let { views, ...rest }: { views: LayoutData["views"] } = $props();
const current_view_href = $derived(page.url.pathname);

// Map view hrefs to translation keys
const viewLabels: Record<string, () => string> = {
	'/': m.nav_tables,
	'/graph': m.nav_graph,
	'/map': m.nav_map,
	'/search': m.nav_search,
	'/admin': () => 'Admin'
};

function getViewLabel(href: string): string {
	return viewLabels[href]?.() ?? href;
}
</script>

{#each Object.values(views) as view}
	<Nav.Item>
		{#if view.href == current_view_href}
			<Nav.Link data-active={true} class="ring ring-accent font-bold select-none">
				{getViewLabel(view.href)}
			</Nav.Link>
		{:else}
			<Nav.Link 
				class="hover:text-hover" 
				href={view.href} 
				onclick={() => { goto(view.href, { invalidate: [view.href] }) }}
			>
				{getViewLabel(view.href)}
			</Nav.Link>
		{/if}
	</Nav.Item>
{/each}
