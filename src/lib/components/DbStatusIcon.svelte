<script lang="ts">
	import Spinner from '$lib/components/ui/spinner/spinner.svelte';
	import type { ConnectionStatus } from 'surrealdb';
	import Button from './ui/button/button.svelte';
	import { onMount } from 'svelte';
	import { twMerge } from 'tailwind-merge';

	let { onclick } = $props();

	let status: ConnectionStatus | 'error' | undefined = $state(undefined);
	let sse = $state(new EventSource('api/v1/db/status'));
	onMount(() => {
		sse.onmessage = (event) => {
			status = event.data;
		};
		return () => sse.close();
	});
	const bg_color = $derived.by(() => {
		switch (status) {
			case 'connected':
				return 'bg-emerald-600';
			case 'connecting':
				return 'bg-sky-600';
			case 'disconnected':
				return 'bg-rose-600';
			case 'reconnecting':
				return 'bg-amber-600';
			default:
				return 'bg-stone-600';
		}
	});
	const text_color = $derived.by(() => {
		switch (status) {
			case 'connected':
				return 'text-emerald-600';
			case 'connecting':
				return 'text-sky-600';
			case 'disconnected':
				return 'text-rose-600';
			case 'reconnecting':
				return 'text-amber-600';
			default:
				return 'text-stone-600';
		}
	});
</script>

<Button {onclick} variant="ghost" class="size-icon cursor-pointer">
	{#if status == 'connecting' || status == 'reconnecting'}
		<Spinner class={twMerge(text_color, ' content-center align-middle')}></Spinner>
	{:else}
		<div
			class={twMerge(
				'icon-[solar--database-bold-duotone] size-4 content-center align-middle',
				bg_color
			)}
		></div>
	{/if}
</Button>
