<script lang="ts" module>
export class DBContext {
	isConnected: boolean = $state(false);
	username?: string = $state();
	userRoles?: Roles[] = $state();
	namespace?: string = $state();
	database?: string = $state();
	constructor(data: LayoutProps["data"]) {
		this.isConnected = data.db.isConnected;
		this.username = data.db.username;
		this.namespace = data.db.namespace;
		this.database = data.db.database;
		watch(()=>this.username, (cur,pre)=>{
			if (!cur) return;
			if (cur == pre) return;
			getNamespaceInfo().then((info)=>{
				const roles = info?.users.find((u)=>u.name == cur)?.roles;
				this.userRoles = roles;
			});
		});
		watch(()=>[this.namespace, this.database], (cur,pre)=>{
			const [ns, db] = cur;
			const [pre_ns, pre_db] = pre ?? [];
			if (!cur) return;
			if (cur == pre) return;
			fetch("/api/v1/db/use", {
				method: "POST",
				body: JSON.stringify({
					namespace: ns,
					database: db,
				}),
			}).catch((e) => {
				error(500, "Error setting namespace/database");
			});
		});
	}
	getRoleString(): string {
		if (!this.userRoles) return ""
		if (this.userRoles.includes("OWNER")) return "Owner";
		if (this.userRoles.includes("EDITOR")) return "Editor"
		return "Viewer"
	}
	isEditor(): boolean {
		if (!this.userRoles) return false
		if (this.userRoles.includes("EDITOR") || this.userRoles.includes("OWNER")){
			return true
		}
		return false
	}
}
</script>
<script lang="ts">
	import { twMerge } from 'tailwind-merge';
	import { watch } from 'runed';
	import { mode, ModeWatcher, toggleMode } from 'mode-watcher';
	import { setContext } from 'svelte';
	import { scale } from 'svelte/transition';
	import { error } from '@sveltejs/kit';
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';

	import type { LayoutProps, PageData } from './$types';
	import { Toaster } from '$lib/components/ui/sonner/index';
	import * as Nav from '$lib/components/ui/navigation-menu/index';
	import { icons } from '$lib/client/color_mode.svelte';
	import DbStatus from '$lib/components/DbStatus.svelte';
	import Views from '$lib/components/Views.svelte';
	import { toast } from 'svelte-sonner';
	import { getNamespaceInfo } from '$lib/db.remote';
	import type { Roles } from '$lib/server/root_db.svelte';

	let { children, data, params }: LayoutProps = $props();
	const current_mode = $derived(mode.current ?? 'system');
	const mode_icon = $derived(icons.get(current_mode));
	const db = setContext("db", new DBContext(data));
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<ModeWatcher />
<Toaster richColors position="top-center" />
<div class="flex size-full flex-col h-dvh ">
	<Nav.Root
		orientation="horizontal"
		class=" bg-header py-0.5 z-50 size-full max-h-16 max-w-full justify-between border-b shadow shadow-border sticky top-0"
	>
			<Nav.List>
				<DbStatus />
				<Views views={data.views} />
			</Nav.List>
			<Nav.List>
						<div class={twMerge("px-1 ",db.isEditor()?"text-destructive":"")}>
							{db.getRoleString()}
						</div>
				<!-- INFO: because both icons packed in one span element rerender needed to apply animation -->
				{#key mode.current}
					<div in:scale>
						<Nav.Item class="px-1 cursor-pointer">
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
<style>
</style>
