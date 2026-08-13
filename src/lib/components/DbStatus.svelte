<script lang="ts">
	import { XIcon, ChevronDown } from '@lucide/svelte/icons';
	import Button from './ui/button/button.svelte';
	import * as Nav from '$lib/components/ui/navigation-menu/index';
	import * as Popover from '$lib/components/ui/popover/index';
	import DbInfo from './DbInfo.svelte';
	import { goto, invalidateAll } from '$app/navigation';
	import { page } from '$app/state';
	import type { DBContext } from '../../routes/+layout.svelte';
	import { getContext } from 'svelte';
	import { getNamespaceInfo, getSystemInfo } from '$lib/db.remote';
	import Spinner from './ui/spinner/spinner.svelte';
	import Skeleton from './ui/skeleton/skeleton.svelte';
	import { getDiagnostics } from '$lib/nodered.remote';
	let { ...rest } = $props();

	async function onclick() {
		// await invalidateAll();
		await goto(page.url, { invalidateAll: true });
	}

	const nsInfo = getNamespaceInfo();
	const db = getContext<DBContext>('db');
</script>

{#key db.isConnected}
	<Nav.Item class="mx-4 size-auto">
		{#if db.isConnected}
			<Popover.Root>
				<Popover.Trigger class="focus-visible:bg-accent">
					<p>{db.username}</p>
					{#if nsInfo.error}
						<XIcon color="var(--color-destructive)" />
					{:else if nsInfo.loading && getSystemInfo().loading && getDiagnostics().loading}
						<Spinner color="var(--color-secondary)" />
					{:else if nsInfo.ready}
						<ChevronDown />
					{/if}
				</Popover.Trigger>
				<Popover.Content>
					{#if nsInfo.error}
						<p class="text-destructive">{JSON.parse(nsInfo.error).message}</p>
						<Button
							variant="secondary"
							class="size-sm cursor-pointer"
							onclick={() => nsInfo.refresh()}>
							Retry
						</Button>
					{:else if nsInfo.loading && getSystemInfo().loading && getDiagnostics().loading}
						<Skeleton class="min-h-1/3 w-full min-w-1/3" />
					{:else if nsInfo.ready}
						<DbInfo />
					{/if}
				</Popover.Content>
			</Popover.Root>
		{:else}
			<Button variant="primary" class="size-sm cursor-pointer" {onclick}>
				<span class="iconify size-4 content-center align-middle solar--database-bold-duotone">
				</span>
			</Button>
		{/if}
	</Nav.Item>
{/key}
