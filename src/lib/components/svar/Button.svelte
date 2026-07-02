<script lang="ts">
	import { cn } from '$lib/utils';
	import { Button } from '@svar-ui/svelte-core';
	let { class: className, text, snippet, ...restProps } = $props();
	$inspect(restProps);
</script>

<Button class={cn("w-full", className)} {...restProps}>{@render snippet?.()} {text}</Button>
