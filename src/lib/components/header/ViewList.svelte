<script lang="ts">
	import { getContext } from 'svelte';

	import * as Nav from '$lib/components/ui/navigation-menu/index';

	import type { ViewController } from '$lib/controller/table.svelte';

	const controller: ViewController = getContext('viewsController');
</script>

{#each controller.availableViews as view}
	<Nav.Item>
		<Nav.Link href={view.href}>{view.name}</Nav.Link>
	</Nav.Item>
{/each}
