<script lang="ts">
	import type { ConnectionStatus } from 'surrealdb';
	import { onMount } from 'svelte';
	import { twMerge } from 'tailwind-merge';
	import { toast } from 'svelte-sonner';

	import { getSurrealContext } from '$lib/client/db.context.svelte';
	import Spinner from '$lib/components/ui/spinner/spinner.svelte';
	import Button from './ui/button/button.svelte';
	import * as Nav from '$lib/components/ui/navigation-menu/index';
	import * as Popover from '$lib/components/ui/popover/index';
	import DbMenu from './DbMenu.svelte';
	import LoginForm from './LoginForm.svelte';

	let { ...rest } = $props();

	// let status: ConnectionStatus | 'error' | undefined = $derived(initialStatus);

	const db = getSurrealContext();
	const status: ConnectionStatus | undefined = $derived(db?.status);

	const text_color = $derived.by(() => {
		if (status == null) return 'text-stone-600';
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

<Nav.Item>
	{#if status == 'connecting' || status == 'reconnecting'}
		<Button {onclick} variant="ghost" class="size-icon cursor-pointer">
			<Spinner class={twMerge(text_color, ' content-center align-middle')}></Spinner>
		</Button>
	{:else if status == null}
		<!-- <div -->
		<!-- 	class={twMerge('icon-[material-symbols--error] size-4 content-center align-middle', bg_color)} -->
		<!-- ></div> -->
		<Popover.Root>
			<Popover.Trigger value="login to db" >
				<Button  class="cursor-pointer bg-sidebar-accent hover:bg-emerald-900 p-2 h-8">
					<span class="icon-[solar--login-3-bold-duotone] text-accent-foreground size-4"></span>
				</Button>
			</Popover.Trigger>
			<Popover.Content>
				<LoginForm />
			</Popover.Content>
		</Popover.Root>
	{:else}
		<Popover.Root>
			<Popover.Trigger>
				<Button variant="ghost" class="size-icon cursor-pointer">
					<div
						class={twMerge(
							'icon-[solar--list-arrow-down-minimalistic-line-duotone] size-6 content-center align-middle'
						)}
					></div>
				</Button>
			</Popover.Trigger>
			<Popover.Content>
				<DbMenu />
			</Popover.Content>
		</Popover.Root>
	{/if}
</Nav.Item>
