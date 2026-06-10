<script lang="ts">
import { toast } from 'svelte-sonner';
import { goto } from '$app/navigation';
import { enhance } from '$app/forms';

import { page } from '$app/state';

import * as Field from '$lib/components/ui/field/index';
import Input from '$lib/components/ui/input/input.svelte';
import Button from '$lib/components/ui/button/button.svelte';

import { getSurrealContext } from '$lib/client/db.context.svelte';


let { ...rest } = $props();

const db = $derived(getSurrealContext());
const url = page.data.db?.url
let form = $state();
$effect(() => {
    if (form?.formErrors && form?.formErrors?.length > 0) {
	form?.formErrors.forEach((e) => toast.error(e));
    }
});
const invalidateRoot = () => {
    return async ({ result, update }) => {
	form = result.data;
	// INFO: on login we need to invalidate all pages so data updated
	if (result.type === 'redirect') {
	    await goto(result.location, { invalidateAll: true });
	    // INFO: this needed for +layout.svelte to update
	    window.location.reload();
	    // goto(result.location, { invalidateAll: true, replaceState: true, state:   });
	}
	await update();
    };
};
</script>

<div class="size-full">
    <form method="post" action="/login" use:enhance={invalidateRoot}>
	<Field.Set class="flex flex-col p-2">
	    {@const urlError = form?.fieldErrors?.url}
	    <Field.Field data-invalid={urlError != undefined} name="url">
		<Field.Content>
		    <Field.Label for="url">URL</Field.Label>
		    <Input
			reqired
			name="url"
			aria-invalid={urlError != undefined}
			type="text"
			value={url}
			autocomplete="ws://localhost:8000"
			placeholder="localhost:port"
		    />
		    <Field.Error>{urlError}</Field.Error>
		</Field.Content>
	    </Field.Field>
	    <!-- <Field.Group class="flex flex-row gap-2"> -->
	    <!-- 	{@const namespaceError = form?.fieldErrors?.namespace} -->
	    <!-- 	{@const databaseError = form?.fieldErrors?.database} -->
	    <!-- 	<Field.Field data-invalid={namespaceError != undefined} name="namespace"> -->
	    <!-- 		<Field.Content> -->
	    <!-- 			<Field.Label for="namespace">Namespace</Field.Label> -->
	    <!-- 			<Input -->
	    <!-- 				aria-invalid={namespaceError != undefined} -->
	    <!-- 				type="text" -->
	    <!-- 				name="namespace" -->
	    <!-- 				placeholder="namespace" -->
	    <!-- 			/> -->
	    <!-- 			<Field.Error>{namespaceError}</Field.Error> -->
	    <!-- 		</Field.Content> -->
	    <!-- 	</Field.Field> -->
	    <!-- 	<Field.Field data-invalid={databaseError != undefined} name="database"> -->
	    <!-- 		<Field.Content> -->
	    <!-- 			<Field.Label for="database">Database</Field.Label> -->
	    <!-- 			<Input -->
	    <!-- 				aria-invalid={databaseError != undefined} -->
	    <!-- 				type="text" -->
	    <!-- 				name="database" -->
	    <!-- 				placeholder="database" -->
	    <!-- 			/> -->
	    <!-- 			<Field.Error>{databaseError}</Field.Error> -->
	    <!-- 		</Field.Content> -->
	    <!-- 	</Field.Field> -->
	    <!-- </Field.Group> -->
	    <Field.Group class="flex flex-row gap-2">
		{@const usernameError = form?.fieldErrors?.username}
		{@const passwordError = form?.fieldErrors?.password}
		<Field.Field data-invalid={usernameError != undefined} name="username">
		    <Field.Content>
			<Field.Label for="username">Username</Field.Label>
			<Input
			    autocomplete="off"
			    aria-invalid={usernameError != undefined}
			    type="text"
			    name="username"
			    placeholder="username"
			/>
			<Field.Error>{usernameError}</Field.Error>
		    </Field.Content>
		</Field.Field>
		<Field.Field data-invalid={passwordError != undefined} name="password">
		    <Field.Content>
			<Field.Label for="password">Password</Field.Label>
			<Input
			    autocomplete="off"
			    aria-invalid={passwordError != undefined}
			    type="password"
			    name="password"
			    placeholder="password"
			/>
			<Field.Error>{passwordError}</Field.Error>
		    </Field.Content>
		</Field.Field>
	    </Field.Group>
	    <Button data-sveltekit-reload class="bg-primary" type="submit">Login</Button>
	</Field.Set>
    </form>
</div>
