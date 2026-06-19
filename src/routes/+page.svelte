<script lang="ts">
	import Tabs from '$lib/view/table/components/Tabs.svelte';
	import { toast } from 'svelte-sonner';
	import { type PageProps } from './$types';
	import Skeleton from '$lib/components/ui/skeleton/skeleton.svelte';

	let { data, ...rest }: PageProps = $props();

</script>

<svelte:boundary onerror={(e)=>{ toast.error(e.body.message)} }>
	{#snippet pending()}
		<Skeleton class="size-full animate-pulse"/>
	{/snippet}
	{#snippet failed(e: unknown)}
		<div class="size-full text-center flex flex-row gap-2 justify-center">
			<div class="text-xl text-rose-400">{e.status}</div>
			<div class="text-xl">{e.body.message}</div>
		</div>
	{/snippet}
<div class="size-full">
	<Tabs tables={data.tables} />
</div>
</svelte:boundary>
