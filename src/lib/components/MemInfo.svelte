<script lang="ts">
    import { getDiagnostics } from "$lib/nodered.remote";
    import * as Popover from "./ui/popover";

    let { system, ...rest } = $props();

    const noderedInfo = await getDiagnostics();

    const dbRam = $derived((system?.memory_usage / 1024 / 1024))
    const noderedRam= $derived((noderedInfo?.nodejs.memoryUsage.rss!/ 1024 / 1024))
</script>
<Popover.Header class="flex size-full flex-col gap-1">
    <div class="flex flex-row justify-between">
	<Popover.Title class="flex flex-row gap-2">
	    <div
		class="icon-node-red"
	    >
	    </div>
	    <p>
		{#if Number.isNaN(noderedRam)}
		    Unavailable
		{:else}
		   {noderedRam.toFixed()}MB
		{/if}
	    </p>
	</Popover.Title>
    </div>
    <div class="flex flex-row justify-between">
	<Popover.Title class="flex flex-row gap-2">
	    <div
		class="icon-surrealdb"
	    >
	    </div>
	    <p>
		{#if Number.isNaN(dbRam)}
		    Unavailable
		{:else}
		   {dbRam.toFixed()}MB
		{/if}
	    </p>
	</Popover.Title>
    </div>
</Popover.Header>
<style>
.icon-surrealdb {
  background-image: url('https://cdn.jsdelivr.net/gh/glincker/thesvg@main/public/icons/surrealdb/default.svg');
  background-size: 100% 100%;
  background-repeat: no-repeat;
  width: 20px;
  height: 20px;
}
.icon-node-red {
  background-image: url('https://cdn.jsdelivr.net/gh/glincker/thesvg@main/public/icons/node-red/default.svg');
  background-size: contain;
  background-repeat: no-repeat;
  width: 20px;
  height: 20px;
}
</style>
