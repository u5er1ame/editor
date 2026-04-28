<script lang="ts">
import { setContext, type Snippet } from 'svelte';
import type { LayoutData } from './$types';
import { ModelStore } from '$lib/model/table.svelte';
import { getSurrealContext } from '$lib/client/db.context.svelte';

type Props = {
	children?: Snippet<[store: ModelStore, props: any]>;
	data?: LayoutData;
	[key: string]: any;
};
let { children, data, ...rest }: Props = $props();
const store = new ModelStore(getSurrealContext());
setContext('model', store);
$inspect(store.views);
</script>

{#if store.ctx?.isAuthenticated}
	{#await store.getTables()}
		<div class="size-full">
			{@render children?.(store, rest)}
		</div>
	{/await}
{/if}
