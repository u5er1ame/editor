<script lang="ts">
	import { Button } from '@svar-ui/svelte-core';
	let { class: className, text, snippet, ...restProps } = $props();
	$inspect(restProps);
</script>

<Button {...restProps}>{@render snippet?.()} {text}</Button>
