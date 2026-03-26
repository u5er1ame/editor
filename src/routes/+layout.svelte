<script lang="ts">
	import './layout.css';
	import { twMerge } from 'tailwind-merge';
	import { mode, ModeWatcher, toggleMode } from 'mode-watcher';
	import { scale } from 'svelte/transition';
	import { toast } from 'svelte-sonner';

	import favicon from '$lib/assets/favicon.svg';
	import { Toaster } from '$lib/components/ui/sonner/index';
	import * as Nav from '$lib/components/ui/navigation-menu/index';
	import { icons } from '$lib/client/color_mode.svelte';
	import DbStatusIcon from '$lib/components/DbStatusIcon.svelte';
	import Spinner from '$lib/components/ui/spinner/spinner.svelte';
	import Button from '$lib/components/ui/button/button.svelte';
	import { getSurrealContext, setSurrealContext } from '$lib/client/db.context.svelte';

	let { children, data, ...rest } = $props();

	const isAuthenticated = $derived(data.creds.token != null);
	if (data.creds.token != null) {
		setSurrealContext(data.creds.url, data.creds.token);
	}
	let db = $derived(getSurrealContext());

	const current_mode = $derived(mode.current ?? 'system');
	const mode_icon = $derived(icons.get(current_mode));

	async function recconect(event: MouseEvent & { currentTarget: EventTarget & HTMLButtonElement }) {
		if (db.status == 'disconnected' || db.status == 'reconnecting') {
			await db.reconnect();
		}
	}
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<ModeWatcher />
<Toaster richColors position="top-center" />

<div class="flex size-full flex-col">
	<Nav.Root
		orientation="horizontal"
		class="z-50 size-full max-h-16 max-w-full justify-between border-b border-b-sidebar-border bg-sidebar"
	>
		<Nav.List>
			{#await new Promise((r) => setTimeout(r, 200))}
				<Spinner />
			{:then}
				<DbStatusIcon />
			{/await}
			<Nav.Item>
				<Nav.Link href="/">Home</Nav.Link>
			</Nav.Item>
			<Nav.Item>
				<Nav.Link href="tables">Tables</Nav.Link>
			</Nav.Item>
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
