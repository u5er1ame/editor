<script lang="ts">
	import './layout.css';
	import { twMerge } from 'tailwind-merge';
	import { mode, ModeWatcher, toggleMode } from 'mode-watcher';
	import { scale } from 'svelte/transition';
	import favicon from '$lib/assets/favicon.svg';
	import { Toaster } from '$lib/components/ui/sonner/index';
	import * as Nav from '$lib/components/ui/navigation-menu/index';
	import { icons } from '$lib/client/color_mode.svelte';
	// import DbStatusIcon from '$lib/components/DbStatusIcon.svelte';
	import Spinner from '$lib/components/ui/spinner/spinner.svelte';
	import Button from '$lib/components/ui/button/button.svelte';

	let { children, data } = $props();

	const current_mode = $derived(mode.current ?? 'system');
	const mode_icon = $derived(icons.get(current_mode));

	async function recconect(event: MouseEvent & { currentTarget: EventTarget & HTMLButtonElement }) {
		if (data.db == 'disconnected' || data.db == 'reconnecting') {
			await fetch('api/v1/db/connect').then((r) => r.json());
		}
	}
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<ModeWatcher />
<Toaster richColors position="top-center" />

<div class="flex size-full flex-col p-1">
	<Nav.Root
		orientation="horizontal"
		class="z-50 size-full max-h-16 max-w-full justify-between gap-1 border-b border-b-stone-400"
	>
		<Nav.List>
			{#await new Promise((r) => setTimeout(r, 200))}
				<Spinner />
			{:then}
				<!-- <DbStatusIcon onclick={recconect} /> -->
			{/await}
			<Nav.Item>
				<Nav.Link href="/">Home</Nav.Link>
			</Nav.Item>
			<Nav.Item>
				<Nav.Link href="tables">Tables</Nav.Link>
			</Nav.Item>
		</Nav.List>
		<Nav.List></Nav.List>
		<Nav.List>
			<!-- INFO: because both icons packed in one span element rerender needed to apply animation -->
			{#key mode.current}
				<div in:scale>
					<Button variant="ghost" class="cursor-pointer" onclick={toggleMode}>
						<span class={twMerge(mode_icon, 'size-6 content-center p-4 align-middle')}></span>
					</Button>
				</div>
			{/key}
		</Nav.List>
	</Nav.Root>
	{@render children()}
</div>
