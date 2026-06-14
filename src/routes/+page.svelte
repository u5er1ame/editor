<script lang="ts">
	import { page } from '$app/state';
	import Tabs from '$lib/view/table/components/Tabs.svelte';
	import { type PageProps } from './$types';

	let { data, ...rest }: PageProps = $props();
	// $inspect(page.state.table); // TODO: create config builder from here?
</script>

<div class="size-full">
	<Tabs tables={data.tables} />
</div>
