<script lang="ts">
    import * as Popover from "./ui/popover";

    let { system, nodejs,...rest } = $props();

    const dbRam = $derived((system?.memory_usage / 1024 / 1024).toFixed(2))
    const noderedRam= $derived((nodejs.memoryUsage.rss/ 1024 / 1024).toFixed(2))
</script>
<Popover.Header class="flex size-full flex-col gap-1">
    <div class="flex flex-row justify-between">
	<Popover.Title class="flex flex-row gap-2">
	    <div
		class="icon-node-red"
	    >
	    </div>
	    <p>{noderedRam}MB</p>
	</Popover.Title>
    </div>
    <div class="flex flex-row justify-between">
	<Popover.Title class="flex flex-row gap-2">
	    <div
		class="icon-surrealdb"
	    >
	    </div>
	    <p>{dbRam}MB</p>
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
