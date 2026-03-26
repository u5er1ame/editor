<script lang="ts">
	import { getSurrealContext } from '$lib/client/db.context.svelte';
	import * as Popover from '$lib/components/ui/popover/index';
	import * as Field from '$lib/components/ui/field/index';
	import * as Select from '$lib/components/ui/select/index';
	import { twMerge } from 'tailwind-merge';
	import { Button } from './ui/button';
	import Spinner from './ui/spinner/spinner.svelte';

	const db = getSurrealContext();

	let ns = $derived(db?.namespace);
	let selectedDb = $derived(db?.database);
	const rootInfo = $derived(await db?.rootInfo());
	$inspect(rootInfo?.system);

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
	<Popover.Title>Database status</Popover.Title>
	<div class="flex flex-row gap-1">
		{#if db.status == 'connected'}
			<p>
				{(rootInfo?.system.memory_usage / 1024 / 1024).toFixed(2)}MB
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
{#if db.status == 'connected'}
	<div class="flex flex-col gap-1">
		<Field.Field>
			<Field.Content class="flex flex-row justify-between gap-2">
				<Field.Label for="namespace">Namespace</Field.Label>
				{#if rootInfo}
					<Select.Root type="single" bind:value={db!.namespace} name="namespace">
						<Select.Trigger class="w-full">{ns ? ns : 'Select namespace'}</Select.Trigger>
						<Select.Content>
							{#each rootInfo.namespaces as namespace}
								<Select.Item label={namespace} value={namespace}>{namespace}</Select.Item>
							{/each}
						</Select.Content>
					</Select.Root>
				{:else}
					<p>No namespaces found in main DB please create one</p>
				{/if}
			</Field.Content>
		</Field.Field>
		{#if ns}
			{#await db?.nsInfo()}
				<Spinner />
			{:then nsInfo}
				<Field.Field>
					<Field.Content class="flex flex-row justify-between gap-2">
						<Field.Label for="database">Database</Field.Label>
						{#if nsInfo}
							<Select.Root type="single" bind:value={db!.database} name="namespace">
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
		{/if}
		<Button variant="destructive" href="/api/v1/logout">Logout</Button>
	</div>
{/if}
