<script lang="ts">
import { getContext } from 'svelte';
import { page } from '$app/state';
import * as Field from '$lib/components/ui/field/index';
import * as Select from '$lib/components/ui/select/index';
import * as Dialog from './ui/dialog/index';
import { Button } from './ui/button';
import Badge from './ui/badge/badge.svelte';
import Input from './ui/input/input.svelte';

import { getNamespaceInfo, expire } from '$lib/db.remote';
import MemInfo from './MemInfo.svelte';
import { toast } from 'svelte-sonner';
import { goto, invalidateAll } from '$app/navigation';

import type { DBContext } from '../../routes/+layout.svelte';

let { ...rest } = $props();

const db = getContext<DBContext>("db");
const nsInfo = getNamespaceInfo();
let showPassPrompt = $state(false);

let selectedUser: string | undefined = $state(db.username);
let passInputRef: HTMLInputElement | null = $state(null);
let pass: string | undefined = $state();
let errorMsg: string | undefined = $state();


function changeUser(_: string) {
	showPassPrompt = true;
}

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

async function onsubmit(e: Event) {
	e.preventDefault();
	const result = await fetch("/api/v1/db/signin", { method: "POST", body: JSON.stringify({ username: selectedUser, password: pass }) });
	if (result.status == 200) {
		showPassPrompt = false;
		pass = undefined;
		db.username = selectedUser;
		toast.success('Login successful');
	    await goto(page.url, { invalidate: [page.url.pathname] });
	}
	else {
		const res = await result.json();
		errorMsg = res.message;
	}
}
function getUsername() {
	return db.username;
}

function setUsername(value: string) {
	showPassPrompt = true;
	selectedUser = value;
}

async function changeDb(val: string) {
	// await fetch("/api/v1/db/use", { method: "POST", body: JSON.stringify({ database: val }) }).then((res)=>res.json());
	db.database = val
}
</script>

<Dialog.Root bind:open={showPassPrompt}>
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

<MemInfo />
<div class="flex flex-col gap-1">
	{#if nsInfo.ready}
		<Field.Field name="username">
			<Field.Content class="flex flex-row justify-between gap-2">
				<Field.Label>Username</Field.Label>
					<Select.Root
						autocomplete="off"
						onValueChange={(e) => changeUser(e)}
						type="single"
						bind:value={getUsername, setUsername}
						name="username"
					>
						<Select.Trigger class="w-full"
						>{db.username ? db.username : 'Select user'}</Select.Trigger
						>
						<Select.Content>
							{#each nsInfo.current?.users as user}
								<Select.Item label={user.name} value={user.name}>
									{user.name}
									{#each user.roles as role}
										<Badge variant={badgeVariant(role)}>{role}</Badge>
									{/each}
								</Select.Item>
							{/each}
						</Select.Content>
					</Select.Root>
			</Field.Content>
		</Field.Field>
		<Field.Field name="database">
			<Field.Content class="flex flex-row justify-between gap-2">
				<Field.Label>Database</Field.Label>
					<Select.Root type="single" bind:value={db.database} name="database" onValueChange={(val)=>{ changeDb(val) }}>
						<Select.Trigger class="w-full"
						>{db.database? db.database: 'Select database'}</Select.Trigger
						>
						<Select.Content>
							{#each nsInfo.current?.databases as database}
								<Select.Item label={database.name} value={database.name}>{database.name}</Select.Item>
							{/each}
						</Select.Content>
					</Select.Root>
			</Field.Content>
		</Field.Field>
	{/if}
	<Button onclick={()=>expire()} variant="destructive" href="/api/v1/logout">Reset login to default user</Button>
</div>
