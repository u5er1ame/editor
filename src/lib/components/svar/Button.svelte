<script lang="ts">
	import { cn } from '$lib/utils';
	// import { Button } from '@svar-ui/svelte-core';
	import { Button } from '../ui/button';
	let {
		id,
		class: className,
		text,
		snippet,
		value = $bindable(),
		onclick,
		onchange,
		...restProps
	} = $props();
</script>

<Button {id} {onclick} class={cn('w-full cursor-pointer', className)} {...restProps}>
	{@render snippet?.()}
	{text}
</Button>
