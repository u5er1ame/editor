<script lang="ts">
	import { Grid, Toolbar, Willow, WillowDark, type IApi } from '@svar-ui/svelte-grid';
	import { mode } from 'mode-watcher';
	import { browser } from '$app/environment';

	const Style = $derived.by(() => {
		if (mode.current && mode.current == 'dark') {
			return WillowDark;
		} else {
			return Willow;
		}
	});
</script>

<div class="size-fit">
	{#if browser}
		<Style>
			<Grid />
		</Style>
	{/if}
</div>
