<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import { Toaster } from '$lib/components/ui/sonner/index';
	import * as Nav from '$lib/components/ui/navigation-menu/index';
	import * as Sidebar from "$lib/components/ui/sidebar/index";

	let { children } = $props();
	// TODO: add theme switcher here
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

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
			<Nav.Item>
				<span class="icon-[solar--hamburger-menu-line-duotone] size-8 content-center align-middle"></span>
			</Nav.Item>
		</Nav.List>
	</Nav.Root>
	{@render children()}
</div>
