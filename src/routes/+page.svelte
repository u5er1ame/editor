<script lang="ts">
	import Tabs from '$lib/view/table/components/Tabs.svelte';
	import { toast } from 'svelte-sonner';
	import { type PageProps } from './$types';
	import Skeleton from '$lib/components/ui/skeleton/skeleton.svelte';

	let { data, ...rest }: PageProps = $props();
</script>

<svelte:boundary onerror={(e)=>{ console.error(e); toast.error(e.message ?? "Error")} }>
	{#snippet pending()}
		<Skeleton class="w-svw h-svh animate-pulse m-1"/>
	{/snippet}
	{#snippet failed(e: unknown)}
		<div class="size-full text-center flex flex-row gap-2 justify-center">
			<div class="text-xl">{e.body?.message}</div>
			<div class="text-xl text-destructive">{e.status}</div>
		</div>
	{/snippet}
<div class="size-full max-w-screen">
	{#await fetch("/api/v1/db/ready")}
		<Skeleton class="w-full h-full animate-pulse m-1"/>
	{:then}
		<Tabs tables={data.tables} />
	{/await}
</div>
</svelte:boundary>
