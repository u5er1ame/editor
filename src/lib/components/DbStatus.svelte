<script lang="ts">
	import ChevronDown from '@lucide/svelte/icons/chevron-down';
	import Button from './ui/button/button.svelte';
	import * as Nav from '$lib/components/ui/navigation-menu/index';
	import * as Popover from '$lib/components/ui/popover/index';
	import DbInfo from './DbInfo.svelte';
	import { goto, invalidateAll } from '$app/navigation';
	import { page } from '$app/state';
	import type { DBContext } from '../../routes/+layout.svelte';
	import { getContext } from 'svelte';

	let { ...rest } = $props();

	async function onclick() {
		invalidateAll().then(async () => await goto(page.url));
	}

	const db = getContext<DBContext>("db");
</script>

{#key db.isConnected}
	<Nav.Item class="mx-4 size-auto" >
		{#if db.isConnected}
			<Popover.Root>
				<Popover.Trigger class="focus-visible:bg-accent">
					<!-- <Button variant="outline" class="size-sm cursor-pointer" > -->
						<p>{db.username}</p>
						<ChevronDown />
					<!-- </Button> -->
				</Popover.Trigger>
				<Popover.Content>
					<DbInfo />
				</Popover.Content>
			</Popover.Root>
		{:else}
			<Button variant="primary" class="size-sm cursor-pointer" {onclick}>
				<span class="icon-[solar--database-bold-duotone] size-4 content-center align-middle "></span>
			</Button>
		{/if}
	</Nav.Item>
{/key}
