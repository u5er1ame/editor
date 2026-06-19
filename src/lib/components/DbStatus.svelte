<script lang="ts">
	import ChevronDown from '@lucide/svelte/icons/chevron-down';
	import Button from './ui/button/button.svelte';
	import * as Nav from '$lib/components/ui/navigation-menu/index';
	import * as Popover from '$lib/components/ui/popover/index';
	import DbInfo from './DbInfo.svelte';
	import { goto, invalidateAll } from '$app/navigation';
	import { page } from '$app/state';

	let { db, nodered, ...rest } = $props();

	async function onclick() {
		invalidateAll().then(async () => await goto(page.url));
	}
</script>

{#key db.isConnected}
	<Nav.Item class="mx-4 size-auto" >
		{#if db.isConnected}
			<Popover.Root>
				<Popover.Trigger class="focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive inline-flex shrink-0 items-center justify-center gap-2 rounded-md text-sm font-medium whitespace-nowrap transition-all outline-none focus-visible:ring-[3px] disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 bg-background hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50 border shadow-xs h-9 px-4 py-2 has-[>svg]:px-3 cursor-pointer">
					<!-- <Button variant="outline" class="size-sm cursor-pointer" > -->
						<p>{db.username}</p>
						<ChevronDown />
					<!-- </Button> -->
				</Popover.Trigger>
				<Popover.Content>
					<DbInfo username={db.username} rootInfo={db.systeminfo} noderedInfo={nodered.diagnostics} />
				</Popover.Content>
			</Popover.Root>
		{:else}
			<Button variant="ghost" class="size-sm cursor-pointer" {onclick}>
				<span class="icon-[solar--database-bold-duotone] size-4 content-center align-middle text-red-500"></span>
			</Button>
		{/if}
	</Nav.Item>
{/key}
