<script lang="ts">
	import { cn } from "$lib/utils.js";
	import { Popover as PopoverPrimitive } from "bits-ui";

	let {
		ref = $bindable(null),
		class: className,
		...restProps
	}: PopoverPrimitive.TriggerProps = $props();
	const id = $props.id();
</script>

<PopoverPrimitive.Trigger
	bind:ref
	data-slot="popover-trigger"
	class={cn("data-[state='open']:border-accent data-[state='open']:bg-active/50 hover:border-hover hover:bg-accent focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive inline-flex shrink-0 items-center justify-center gap-2 rounded-md text-sm font-medium whitespace-nowrap transition-all outline-none focus-visible:ring-[3px] disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 hover:text-hover border shadow-xs h-9 px-4 py-2 has-[>svg]:px-3 cursor-pointer",className)}
	{...restProps}
/>

<style>
</style>
