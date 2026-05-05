<script lang="ts">
import { page } from '$app/state';
import { getContext } from 'svelte';
import * as Nav from '$lib/components/ui/navigation-menu/index';

import type { ViewController } from '$lib/controller/table.svelte';

const controller: ViewController = getContext('viewsController');
const current_view_href = $derived(page.url.pathname);
</script>

{#each controller.availableViews as view}
	{#if view.href == current_view_href}
		<Nav.Item>
			<Nav.Link class="bg-accent font-bold" href={view.href}>{view.name}</Nav.Link>
		</Nav.Item>
	{:else}
		<Nav.Item>
			<Nav.Link href={view.href}>{view.name}</Nav.Link>
		</Nav.Item>
	{/if}
{/each}
