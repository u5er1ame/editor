<script lang="ts">
import { twMerge } from "tailwind-merge";

import { getSurrealContext } from "$lib/client/db.context.svelte";
import Button from "./ui/button/button.svelte";
import Spinner from "./ui/spinner/spinner.svelte";
	import type { ConnectionStatus } from "surrealdb";

let { children, withReconnectButton, ...rest } = $props();

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
{#snippet spinner()}
    {#if withReconnectButton}
	<Button onclick={()=>db?.reconnect()} variant="ghost" class="size-icon cursor-pointer">
	    <Spinner class={twMerge(text_color, ' content-center align-middle')} />
	</Button>
    {:else}
	<Spinner class={twMerge(text_color, ' content-center align-middle')} />
    {/if}
{/snippet}

{#if status != 'connected' && status != 'disconnected'}
    {@render spinner()}
{:else if status == "disconnected"}
    <Button onclick={()=>db?.reconnect()} variant="ghost" class="size-icon cursor-pointer" >
	<div
	    class={twMerge(
		'iconify solar--database-bold-duotone size-4 content-center align-middle',
		text_color
	    )}
	></div>
    </Button>
{:else if status == "connected"}
    {@render children?.()}
{/if}
