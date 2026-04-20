<script lang="ts">
	import { getSurrealContext } from '$lib/client/db.context.svelte';
	import * as Popover from '$lib/components/ui/popover/index';
	import * as Field from '$lib/components/ui/field/index';
	import * as Select from '$lib/components/ui/select/index';
	import { twMerge } from 'tailwind-merge';
	import { Button } from './ui/button';
	import Spinner from './ui/spinner/spinner.svelte';
	import { page } from '$app/state';

	const db = getSurrealContext();

	let selectedDb = $derived(db?.database);
	const rootInfo = $derived(page.data.db.info);

	const bg_color = $derived.by(() => {
		if (db!.status == null) return 'bg-stone-600';
		switch (db!.status) {
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

	$effect(() => {
		if (!db) return;
		// if (ns) {
		// 	db.namespace = ns;
		// }
		// if (selectedDb) {
		// 	db.database = selectedDb;
		// }
	});
	// $inspect(ns, selectedDb);
</script>

<Popover.Header class="flex size-full flex-row justify-between">
	<Popover.Title>
			<Field.Field>
				<Field.Content class="flex flex-row justify-between gap-2">
					<Field.Label for="username">Username</Field.Label>
					<!-- {#if db.nsInfo()} -->
					<!-- 	<Select.Root type="single" bind:value={db!.username} name="username"> -->
					<!-- 		<Select.Trigger class="w-full" -->
					<!-- 			>{db?.username}</Select.Trigger -->
					<!-- 		> -->
					<!-- 		<Select.Content> -->
					<!-- 			{#each nsInfo?.users as user} -->
					<!-- 				<Select.Item label={user} value={db}>{db}</Select.Item> -->
					<!-- 			{/each} -->
					<!-- 		</Select.Content> -->
					<!-- 	</Select.Root> -->
					<!-- {/if} -->
				</Field.Content>
			</Field.Field>
	</Popover.Title>
	<div class="flex flex-row gap-1">
		{#if db && db.status == 'connected'}
			<p>
				{(rootInfo?.memory_usage / 1024 / 1024).toFixed(2)}MB
			</p>
		{/if}
		<p>
			{db!.status}
		</p>
		<div
			class={twMerge(
				'icon-[solar--database-bold-duotone] size-4 content-center align-bottom',
				bg_color
			)}
		></div>
	</div>
</Popover.Header>
{#if db && db.status == 'connected'}
	<div class="flex flex-col gap-1">
		{#await db?.nsInfo()}
			<Spinner />
		{:then nsInfo}
			<Field.Field>
				<Field.Content class="flex flex-row justify-between gap-2">
					<Field.Label for="database">Database</Field.Label>
					{#if nsInfo}
						<Select.Root type="single" bind:value={db!.database} name="database">
							<Select.Trigger class="w-full"
								>{selectedDb ? selectedDb : 'Select database'}</Select.Trigger
							>
							<Select.Content>
								{#each nsInfo?.databases as db}
									<Select.Item label={db} value={db}>{db}</Select.Item>
								{/each}
							</Select.Content>
						</Select.Root>
					{:else}
						<p>No namespaces found in main DB please create one</p>
					{/if}
				</Field.Content>
			</Field.Field>
		{/await}
		<Button variant="destructive" href="/api/v1/logout">Logout</Button>
	</div>
{/if}
