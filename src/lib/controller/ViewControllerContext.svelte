<script lang="ts">
import { onMount, setContext, type Snippet } from "svelte";
import { browser } from "$app/environment";
import Skeleton from "$lib/components/ui/skeleton/skeleton.svelte";
import { getSurrealContext, type DatabaseInfo } from "$lib/client/db.context.svelte";
import { ViewController } from "./table.svelte";
import type { View } from "$lib/view/table.svelte";

let { children, views, ...rest }: { children: Snippet<[]>, views: View[] } = $props();

const ctx = getSurrealContext();
$inspect(views)
const controller = new ViewController();
controller.registerViews(views);
let info: DatabaseInfo | undefined = $state();
setContext("viewController", controller);

async function init() {
    if (!ctx || !ctx.isConnected) return;
    info = await ctx?.dbInfo();
}

$effect(()=>{
    if (info == undefined) return;
    controller.setTablesInfo(info);
});

</script>

{#if browser}
    {#await init() then}
        {@render children?.()}
    {/await}
{:else}
    <Skeleton class="size-full" />
{/if}
