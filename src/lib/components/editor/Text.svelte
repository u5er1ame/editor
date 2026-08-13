<script lang="ts">
	import Label from '../ui/label/label.svelte';

	let { value, name, ...rest } = $props();
</script>

<input type="hidden" {value} {name} />
<Label>{name}</Label>
<div class="size-full p-1 text-lg text-popover-foreground/50">
	{value}
</div>
