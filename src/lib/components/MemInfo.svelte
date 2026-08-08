<script lang="ts">
    import { getDiagnostics } from "$lib/nodered.remote";
    import * as Popover from "./ui/popover";
    import nodered from "$lib/assets/nodered.svg"
    import surrealdb from "$lib/assets/db.svg"
    let { system, ...rest } = $props();

    const noderedInfo = await getDiagnostics();

    const dbRam = $derived((system?.memory_usage / 1024 / 1024))
    const noderedRam= $derived((noderedInfo?.nodejs.memoryUsage.rss!/ 1024 / 1024))
</script>
<Popover.Header class="flex size-full flex-col gap-1">
    <div class="flex flex-row justify-between">
	<Popover.Title class="flex flex-row gap-2">
	    <img
		class="icon-node-red"
		src={nodered}
		alt="Node-red icon"
	    />
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
	    <img
		class="icon-surrealdb"
		src={surrealdb}
		alt="Db icon"
	    />
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
