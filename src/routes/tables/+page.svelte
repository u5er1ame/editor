<script lang="ts">
	import { toast } from 'svelte-sonner';
	import { Button } from '$lib/components/ui/button';
	import { ScrollArea } from '$lib/components/ui/scroll-area/index.js';
	import Table from '$lib/components/Table.svelte';

	let { data, ...rest } = $props();
	const tables = $derived(data.tables);
	let fields: any[] = $state([]);
	function getIcon(table: any) {
		switch (table.kind.kind) {
			case 'RELATION':
				return `<span class="icon-[material-symbols--graph-8]"></span>`;
			case 'NORMAL':
				if (table.view) {
					return `<span class="icon-[material-symbols--table-eye-outline]"></span>`
				}
			default:
				return '';
		}
	}
	async function getFields(table: string) {
		fields = await fetch(`/api/v1/db/tables/schema/${table}`).then(r => r.json()).then((r)=>r);
	}

</script>

<ScrollArea orientation="horizontal">
	<div class="flex flex-row gap-2 p-1">
		{#each tables as table, i}
			<Button onclick={()=>getFields(table.name)} variant="outline">{table.name}{@html getIcon(table)}</Button>
		{/each}
	</div>
</ScrollArea>
<svelte:boundary onerror={(e, reset) => toast.error(e as string)}><Table /></svelte:boundary>
