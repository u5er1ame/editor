<script lang="ts">
import * as Tabs from '$lib/components/ui/tabs';
import Table from '$lib/components/Table.svelte';
import type { IColumn } from '@svar-ui/svelte-grid';
import { getSurrealContext } from '$lib/client/db.context.svelte.js';
import Spinner from '$lib/components/ui/spinner/spinner.svelte';
import Skeleton from '$lib/components/ui/skeleton/skeleton.svelte';

let { data, ...rest } = $props();

const db = getSurrealContext();

function isWriteable(table: any) {
	if (table.drop) {
		return `<span class="icon-[material-symbols--lock] text-red-500"></span>`;
	} else {
		return ``;
	}
}
function getKind(table: any) {
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

{#await db?.dbInfo()}
	<Skeleton class="m-1 h-8 w-full" />
	{:then info}
	{#if info}
		<div class="size-full p-1">
			{#if info.tables.length > 0}
				<Tabs.Root>
					<Tabs.List class="size-full">
						{#each info.tables as table, i}
							<Tabs.Trigger
								value={table.name}
								title={table.name + (table.drop ? ' Writes disabled' : '')}
							>
								{@html isWriteable(table)}{table.name}{@html getKind(table)}
							</Tabs.Trigger>
						{/each}
					</Tabs.List>
					{#each info.tables as table}
						<Tabs.Content value={table.name}>
							<Table table={table.name} isWriteable={!table.drop} />
						</Tabs.Content>
					{/each}
				</Tabs.Root>
			{:else}
				<div class="size-full">
					<div class="text-center">
						<div class="text-xl">No tables found</div>
					</div>
				</div>
			{/if}
		</div>
	{/if}
{/await}
