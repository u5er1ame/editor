<script lang="ts">
import { page } from '$app/state';
import { getSurrealContext } from '$lib/client/db.context.svelte';
import * as Popover from '$lib/components/ui/popover/index';
import * as Field from '$lib/components/ui/field/index';
import * as Select from '$lib/components/ui/select/index';
import * as Dialog from './ui/dialog/index';
import { Button } from './ui/button';
import Spinner from './ui/spinner/spinner.svelte';
import Badge from './ui/badge/badge.svelte';
import Input from './ui/input/input.svelte';

const db = getSurrealContext();

let selectedDb = $derived(db!.database);
let currentUser = $derived(db!.username);
let showPassPrompt = $state(false);

// svelte-ignore state_referenced_locally
let selectedUser: string = $state(currentUser);
let passInputRef: HTMLInputElement | null = $state(null);
let pass: string | undefined = $state();
let errorMsg: string | undefined = $state();

const rootInfo = $derived(page.data.db.info);

function changeUser(e: string) {
	showPassPrompt = true;
	console.log('CHANGE USER', e);
}
$inspect(currentUser);
function badgeVariant(role: string) {
	switch (role) {
		case 'OWNER':
			return 'destructive';
		case 'EDITOR':
			return 'default';
		case 'VIEWER':
			return 'outline';
		default:
			return 'outline';
	}
}
$effect(() => {
	if (!db) return;
	// if (ns) {
	// 	db.namespace = ns;
	// }
	// if (selectedDb) {
	// 	db.database = selectedDb;
	// }
});

async function onsubmit(e: Event) {
	e.preventDefault();
	console.log(e);
	console.log('submit', selectedUser, pass);
	errorMsg = await db?.signin({ username: selectedUser, password: pass! });
	if (errorMsg == undefined) {
		showPassPrompt = false;
	}

}
function getUsername() {
	return currentUser;
}
function setUsername(value: string) {
	showPassPrompt = true;
	selectedUser = value;
}
</script>

<Dialog.Root bind:open={showPassPrompt} onOpenChangeComplete={() => console.log('close')}>
	<Dialog.Portal>
		<Dialog.Overlay />
		<Dialog.Content
			onOpenAutoFocus={(e: Event) => {
				e.preventDefault();
				passInputRef?.focus();
			}}
		>
				<Dialog.Header>
					<Dialog.Title>Enter password</Dialog.Title>
					<Dialog.Close />
				</Dialog.Header>
			<form {onsubmit}>
				<Field.Field data-invalid={errorMsg != undefined}>
					<Field.Content class="flex flex-row justify-between gap-2">
						<Field.Label for="password">Password</Field.Label>
						<Input
							bind:ref={passInputRef}
							required
							aria-invalid={errorMsg != undefined}
							bind:value={pass}
							autocomplete="off"
							type="password"
							placeholder="Enter password"
						/>
					</Field.Content>
					<Field.Error>{errorMsg}</Field.Error>
				</Field.Field>
			</form>
		</Dialog.Content>
	</Dialog.Portal>
</Dialog.Root>

{#await db?.nsInfo()}
	<Spinner />
	{:then nsInfo}
	<Popover.Header class="flex size-full flex-row justify-between">
		<Popover.Title>
			<p>{db!.status}</p>
		</Popover.Title>
		<div class="flex flex-row gap-1">
			<p>
				RAM {(rootInfo?.memory_usage / 1024 / 1024).toFixed(2)}MB
			</p>
			<div
				class="icon-[solar--database-bold-duotone] size-4 content-center bg-emerald-600 align-bottom"
			></div>
		</div>
	</Popover.Header>
	<div class="flex flex-col gap-1">
		<Field.Field>
			<Field.Content class="flex flex-row justify-between gap-2">
				<Field.Label for="username">Username</Field.Label>
				{#if nsInfo}
					<Select.Root
						onValueChange={(e) => changeUser(e)}
						type="single"
						bind:value={getUsername, setUsername}
						name="username"
					>
						<Select.Trigger class="w-full"
						>{currentUser ? currentUser : 'Select user'}</Select.Trigger
						>
						<Select.Content>
							{#each nsInfo?.users as user}
								<Select.Item label={user.name} value={user.name}>
									{user.name}
									{#each user.roles as role}
										<Badge variant={badgeVariant(role)}>{role}</Badge>
									{/each}
								</Select.Item>
							{/each}
						</Select.Content>
					</Select.Root>
				{:else}
					<p>No users found. How did you get here?</p>
				{/if}
			</Field.Content>
		</Field.Field>
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
								<Select.Item label={db.name} value={db.name}>{db.name}</Select.Item>
							{/each}
						</Select.Content>
					</Select.Root>
				{:else}
					<p>No databases found in main DB please create one</p>
				{/if}
			</Field.Content>
		</Field.Field>
		<Button onclick={()=>db?.invalidate()} variant="destructive" href="/api/v1/logout">Reset login to default user</Button>
	</div>
{/await}
