<script lang="ts">
	import Tabs from '$lib/view/table/components/Tabs.svelte';
	import { toast } from 'svelte-sonner';
	import { type PageProps } from './$types';
	import Skeleton from '$lib/components/ui/skeleton/skeleton.svelte';

	let { data, ...rest }: PageProps = $props();
</script>

<svelte:boundary
	onerror={(e) => {
		console.error(e);
		toast.error(e.message ?? 'Error');
	}}>
	{#snippet pending()}
		<Skeleton class="m-1 h-svh w-svw animate-pulse" />
	{/snippet}
	{#snippet failed(e: unknown, reset)}
		<div class="flex size-full flex-row justify-center gap-2 text-center">
			<div class="text-xl">{e.body?.message}</div>
			<div class="text-xl text-destructive">{e.status}</div>
		</div>
	{/snippet}
	<div class="size-full max-w-screen">
		{#await fetch('/api/v1/db/ready')}
			<Skeleton class="m-1 h-full w-full bg-background" />
		{:then}
			<Tabs tables={data.tables} />
		{/await}
	</div>
</svelte:boundary>
