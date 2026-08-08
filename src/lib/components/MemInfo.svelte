<script lang="ts">
    import { getDiagnostics } from "$lib/nodered.remote";
    import { getSystemInfo } from "$lib/db.remote";
    import Spinner from "./ui/spinner/spinner.svelte";
    import * as Popover from "./ui/popover";
    import nodered from "$lib/assets/nodered.svg"
    import surrealdb from "$lib/assets/db.svg"
    let { ...rest } = $props();

</script>
<Popover.Header class="flex size-full flex-col gap-1">
    <div class="flex flex-row justify-between">
	<Popover.Title class="flex flex-row gap-2">
	    <img
		class="icon-node-red"
		src={nodered}
		alt="Node-red icon"
	    />
	    {#await getDiagnostics()}
		<Spinner />
	    {:then data}
		{@const ram= (data?.nodejs.memoryUsage.rss!/ 1024 / 1024)}
		<p>
		    {#if Number.isNaN(ram)}
			Unavailable
		    {:else}
		       {ram.toFixed()}MB
		    {/if}
		</p>
	    {:catch e}
		<p class="text-destructive">
		    {e}
		</p>
	    {/await}
	</Popover.Title>
    </div>
    <div class="flex flex-row justify-between">
	<Popover.Title class="flex flex-row gap-2">
	    <img
		class="icon-surrealdb"
		src={surrealdb}
		alt="Db icon"
	    />
	    {#await getSystemInfo()}
		<Spinner />
	    {:then data}
		{@const ram = (data?.system?.memory_usage!/ 1024 / 1024)}
		<p>
		    {#if Number.isNaN(ram)}
			Unavailable
		    {:else}
		       {ram.toFixed()}MB
		    {/if}
		</p>
	    {:catch e}
		<p class="text-destructive">
		    {e}
		</p>
	    {/await}
	</Popover.Title>
    </div>
</Popover.Header>
<style>
.icon-surrealdb {
  background-size: 100% 100%;
  background-repeat: no-repeat;
  width: 20px;
  height: 20px;
}
.icon-node-red {
  background-size: contain;
  background-repeat: no-repeat;
  width: 20px;
  height: 20px;
}
</style>
