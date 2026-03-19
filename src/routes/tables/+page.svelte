<script lang="ts">
	import * as Tabs from '$lib/components/ui/tabs';
	import Table from '$lib/components/Table.svelte';
	import type { IColumn } from '@svar-ui/svelte-grid';

	let { data, ...rest } = $props();

	const tables = $derived(data.tables);

	$inspect(tables);
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
				<Tabs.Trigger value={table.name}>
					{table.name}{@html getIcon(table)}</Tabs.Trigger
				>
			{/each}
		</Tabs.List>
		{#each tables as table}
			<Tabs.Content value={table.name}>
				<Table table={table.name} />
			</Tabs.Content>
		{/each}
	</Tabs.Root>
</div>
