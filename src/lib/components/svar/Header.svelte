<script lang="ts">
	import { type ICellProps } from "@svar-ui/svelte-grid";
	import { Text } from "@svar-ui/svelte-core";
	import NavigationMenuItem from "../ui/navigation-menu/navigation-menu-item.svelte";

	let { onaction, column, row, api }: ICellProps = $props();

	let filterValue: string | number | undefined = $state();

	function onFilter(ev: {input?: boolean, value: string | number }) {
		const { input, value } = ev;
		console.log("filter", value, input);
		onaction({ action: "filter-rows", data: { value: value, key: column.id } });
		filterValue = value;
	}
</script>

<div class="size-full flex flex-col">
	<div class="size-full text-center">
		<div class="text-xl">
			{column.id}
		</div>
	</div>
	<!-- <Text onchange={(ev)=>{onFilter(ev)}} value={filterValue} /> -->
</div>
