<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import { twMerge } from 'tailwind-merge';
	import { Toaster } from '$lib/components/ui/sonner/index';
	import * as Nav from '$lib/components/ui/navigation-menu/index';
	import { icons } from "$lib/client/color_mode.svelte";
	import { mode, ModeWatcher, toggleMode } from 'mode-watcher';
	import { scale } from 'svelte/transition';
	import { invalidateAll } from '$app/navigation';
	import Spinner from '$lib/components/ui/spinner/spinner.svelte';
	import { tick } from 'svelte';

	let { children, data } = $props();

	let max_retry = 10;
	let title = $derived(data.db);
	$effect(()=>{
		if (data.db == "reconnecting" || data.db == "connecting") {
			tick().then(()=>{
				invalidateAll();
			});
		}
	});
	let connection_status = $derived.by(()=>{
		switch(data.db) {
			case "connected":
				return "text-emerald-600";
			case "connecting":
				return "text-sky-600";
			case "disconnected":
				return "text-rose-600";
			case "reconnecting":
				return "text-amber-600";
			default:
				return "text-stone-600";
		}
	});
	// TODO: add theme switcher here
	const current_mode = $derived(mode.current ?? "system");
	const mode_icon = $derived(icons.get(current_mode));

	function recconect(event: MouseEvent & { currentTarget: EventTarget & HTMLButtonElement; }) {
		if (data.db == "disconnected" || data.db == "reconnecting") {
			fetch("api/v1/db/connect")
		}
		invalidateAll();
	}
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<ModeWatcher />
<Toaster richColors position="top-center" />

<div class="flex flex-col size-full">
	<Nav.Root orientation="horizontal" class="gap-1 size-full justify-between max-w-full max-h-16 border-b border-b-stone-400 z-50">
		<Nav.List>
			{#await new Promise(r => setTimeout(r, 300))}
				<Spinner/>
			{:then}
				<Nav.Item class={twMerge(connection_status,"cursor-pointer flex flex-row")} onclick={recconect} {title} >
					{#if data.db == "connecting" || data.db == "reconnecting"}
						<button class="icon-[solar--database-bold-duotone] size-4 content-center align-middle"></button>
						<Spinner/>
					{:else}
						<button class={twMerge(connection_status,"icon-[solar--database-bold-duotone] size-4 content-center align-middle")}></button>
					{/if}
				</Nav.Item>
			{/await}
			<Nav.Item>
				<Nav.Link href="/">Home</Nav.Link>
			</Nav.Item>
			<Nav.Item>
				<Nav.Link href="tables">Tables</Nav.Link>
			</Nav.Item>
		</Nav.List>
		<Nav.List>
		</Nav.List>
			<Nav.List>
			<!-- INFO: because both icons packed in one span element rerender needed to apply animation -->
			{#key mode.current }
				<div in:scale >
					<Nav.Item class="cursor-pointer" onclick={toggleMode}>
						<span class={twMerge(mode_icon,"p-4 size-6 content-center align-middle")}></span>
					</Nav.Item>
				</div>
			{/key}
			</Nav.List>
	</Nav.Root>
	{@render children()}
</div>
