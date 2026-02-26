<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import { twMerge } from 'tailwind-merge';
	import { Toaster } from '$lib/components/ui/sonner/index';
	import * as Nav from '$lib/components/ui/navigation-menu/index';
	import { icons } from "$lib/client/color_mode.svelte";
	import { mode, ModeWatcher, toggleMode } from 'mode-watcher';
	import { scale } from 'svelte/transition';

	let { children } = $props();
	// TODO: add theme switcher here
	const current_mode = $derived(mode.current ?? "system");
	const mode_icon = $derived(icons.get(current_mode));
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<ModeWatcher />
<Toaster richColors position="top-center" />

<div class="flex flex-col size-full">
	<Nav.Root orientation="horizontal" class="gap-1 size-full justify-between max-w-full">
		<Nav.List>
			<Nav.Item>
				<span class="icon-[solar--hamburger-menu-line-duotone] size-8 content-center align-middle"></span>
			</Nav.Item>
			<Nav.Item>
				<Nav.Link href="/">Home</Nav.Link>
			</Nav.Item>
		</Nav.List>
			<Nav.List>
			<!-- INFO: because both icons packed in one span element rerender needed to apply animation -->
			{#key mode.current }
				<div in:scale >
					<Nav.Item class="cursor-pointer" onclick={toggleMode}>
						<span class={twMerge(mode_icon,"size-8 content-center align-middle")}></span>
					</Nav.Item>
				</div>
			{/key}
			</Nav.List>
	</Nav.Root>
	{@render children()}
</div>
