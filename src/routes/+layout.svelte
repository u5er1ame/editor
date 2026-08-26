
<script lang="ts">
	import type { Pathname } from '$app/types';
	import { resolve } from '$app/paths';
	import { locales, localizeHref } from '$lib/paraglide/runtime';
	import { twMerge } from 'tailwind-merge';

	import { mode, ModeWatcher, toggleMode } from 'mode-watcher';
	import { setContext } from 'svelte';
	import { scale } from 'svelte/transition';
	import './layout.css';
	import type { LayoutProps } from './$types';
	import { Toaster } from '$lib/components/ui/sonner/index';
	import * as Nav from '$lib/components/ui/navigation-menu/index';
	import { icons } from '$lib/client/color_mode.svelte';
	import DbStatus from '$lib/components/DbStatus.svelte';
	import Views from '$lib/components/Views.svelte';
	import LocaleSwitcher from '$lib/components/LocaleSwitcher.svelte';
	import { DBContext, DB_CONTEXT_KEY } from '$lib/app/session/db-context.svelte';

	import { page } from '$app/state';
	import * as m from '$lib/paraglide/messages';

	let { children, data }: LayoutProps = $props();
	const current_mode = $derived(mode.current ?? 'system');
	const mode_icon = $derived(icons.get(current_mode));
	const db = setContext(DB_CONTEXT_KEY, new DBContext(() => data.db));

	function getRoleString(): string {
		if (!db.userRoles) return '';
		if (db.userRoles.includes('OWNER')) return m.role_owner();
		if (db.userRoles.includes('EDITOR')) return m.role_editor();

		return m.role_viewer();
	}
</script>

<svelte:head></svelte:head>
<ModeWatcher />
<Toaster richColors position="top-center" />

<div class="flex size-full h-dvh flex-col">
	<Nav.Root
		orientation="horizontal"
		class=" sticky top-0 z-50 size-full max-h-16 max-w-full justify-between border-b bg-header py-0.5 shadow shadow-border">
		<Nav.List>
			<DbStatus />
			<Views views={data.views} />
		</Nav.List>

		<Nav.List>
			<div class={twMerge('px-1 ', db.isEditor() ? 'text-destructive' : '')}>{getRoleString()}</div>

			<LocaleSwitcher />
			<!-- INFO: because both icons packed in one span element rerender needed to apply animation -->

			{#key mode.current}
				<div in:scale>
					<Nav.Item class="cursor-pointer px-1">
						<Nav.Link onclick={toggleMode} class="hover:text-hover">
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

<div style="display:none">
	{#each locales as locale (locale)}
		<a href={resolve(localizeHref(page.url.pathname, { locale }) as Pathname)}>{locale}</a>
	{/each}
</div>

<style></style>
