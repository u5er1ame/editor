<script lang="ts">
	import './layout.css';
	import { twMerge } from 'tailwind-merge';
	import { mode, ModeWatcher, toggleMode } from 'mode-watcher';
	import { scale } from 'svelte/transition';

	import type { LayoutProps } from './$types';
	import favicon from '$lib/assets/favicon.svg';
	import { Toaster } from '$lib/components/ui/sonner/index';
	import * as Nav from '$lib/components/ui/navigation-menu/index';
	import { icons } from '$lib/client/color_mode.svelte';
	import DbStatusIcon from '$lib/components/DbStatusIcon.svelte';
	import Spinner from '$lib/components/ui/spinner/spinner.svelte';
	import SurrealContextProvider from '$lib/components/SurrealContextProvider.svelte';
	import ViewControllerContext from '$lib/controller/ViewControllerContext.svelte';

	import ViewList from '$lib/components/header/ViewList.svelte';
	import { DefaultView } from '$lib/view/default/view.svelte';
	import { TableView } from '$lib/view/table/view.svelte';
	import { GraphView } from '$lib/view/graph.svelte';

	let { children, data, params }: LayoutProps = $props();

	const current_mode = $derived(mode.current ?? 'system');
	const mode_icon = $derived(icons.get(current_mode));

	const views = [new DefaultView(), new TableView(), new GraphView()];
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<ModeWatcher />
<Toaster richColors position="top-center" />

<SurrealContextProvider db={data.db}>
	<ViewControllerContext {views}>
		<div class="flex size-full flex-col">
			<Nav.Root
				orientation="horizontal"
				class="z-50 size-full max-h-16 max-w-full justify-between border-b border-b-sidebar-border bg-sidebar py-1"
			>
				<Nav.List>
					{#await new Promise((r) => setTimeout(r, 200))}
						<Spinner />
					{:then}
						<DbStatusIcon />
					{/await}
					<!-- <Nav.Item> -->
					<!-- 	<Nav.Link href="/">Graph</Nav.Link> -->
					<!-- </Nav.Item> -->
					<!-- <Nav.Item> -->
					<!-- 	<Nav.Link href="tables">Tables</Nav.Link> -->
					<!-- </Nav.Item> -->
					<ViewList />
				</Nav.List>
				<Nav.List>
					<!-- INFO: because both icons packed in one span element rerender needed to apply animation -->
					{#key mode.current}
						<div in:scale>
							<Nav.Item>
								<Nav.Link onclick={toggleMode}>
									<!-- <Button variant="ghost" class="cursor-pointer" onclick={toggleMode}> -->
									<span class={twMerge(mode_icon, 'content-center align-middle')}></span>
									<!-- </Button> -->
								</Nav.Link>
							</Nav.Item>
						</div>
					{/key}
				</Nav.List>
			</Nav.Root>
			{@render children()}
		</div>
	</ViewControllerContext>
</SurrealContextProvider>
