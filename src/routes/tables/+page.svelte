<script lang="ts">
	import { toast } from 'svelte-sonner';
	import * as Tabs from '$lib/components/ui/tabs';
	import { Button } from '$lib/components/ui/button';
	import { ScrollArea } from '$lib/components/ui/scroll-area/index.js';
	import Table from '$lib/components/Table.svelte';
	import type { IColumn } from '@svar-ui/svelte-grid';
	import { tick } from 'svelte';

	let { data, ...rest } = $props();
	const tables = $derived(data.tables);
	let fields: any[] = $state([]);
	function getIcon(table: any) {
		switch (table.kind.kind) {
			case 'RELATION':
				return `<span class="icon-[material-symbols--graph-8]"></span>`;
			case 'NORMAL':
				if (table.view) {
					return `<span class="icon-[material-symbols--table-eye-outline]"></span>`;
				}
			default:
				return '';
		}
	}

	let columns: IColumn[] = $state([]);
	let values = $state({data: []});
	async function getFields(table: string) {
		fields = await fetch(`/api/v1/db/tables/schema/${table}`)
			.then((r) => r.json())
			.then((r) => r);
		columns = fields.map(columnFromFieldDef);

		await tick()
		values = await fetch(`/api/v1/db/tables?q=${table}`).then((r) => r.json());
	}

	function columnFromFieldDef(field: any): IColumn {
		return {
			id: field.name,
			header: field.name,
			editor: (r, c) => {
				if (field.readonly) {
					return null;
				}
				if (field.kind.includes('record')) {
					return null;
				}
				return 'text';
			}
		};
	}
</script>

<div class="size-full p-1">
	<Tabs.Root>
		<Tabs.List class="size-full">
			{#each tables as table, i}
				<Tabs.Trigger value={table.name} variant="outline"
					>{table.name}{@html getIcon(table)}</Tabs.Trigger>
			{/each}
		</Tabs.List>
		{#each tables as table}
			<Tabs.Content value={table.name}>
				<Table table={table.name} />
			</Tabs.Content>
		{/each}
	</Tabs.Root>
</div>
