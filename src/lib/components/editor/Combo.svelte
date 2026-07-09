<script lang="ts">
import CheckIcon from "@lucide/svelte/icons/check";
import ChevronsUpDownIcon from "@lucide/svelte/icons/chevrons-up-down";
import { tick } from "svelte";
import * as Command from "$lib/components/ui/command/index.js";
import * as Popover from "$lib/components/ui/popover/index.js";
import { Button } from "$lib/components/ui/button/index.js";
import { cn } from "$lib/utils.js";

let { data, name, value=$bindable(), props, ...rest } = $props();
let open = $state(false);
let triggerRef = $state<HTMLButtonElement>(null!);
const selectedValue = $derived.by(()=>{
    const item = data.find((f) =>{ if(!f) return false; return createValue(f) == value });
    return item?createLabel(item):undefined;
});

// We want to refocus the trigger button when the user selects
// an item from the list so users can continue navigating the
// rest of the form with the keyboard.
function closeAndFocusTrigger() {
    open = false;
    tick().then(() => {
	triggerRef.focus();
    });
}

function createLabel(item: any) {
        return item[props.labelKey]
}

function createValue(item: any) {
	return item[props.valueKey]
}
</script>

<input type="hidden" value={value?.length == 0 ? undefined : value} name={name} />
<Popover.Root bind:open >
    <Popover.Trigger {name} bind:ref={triggerRef}>
	{#snippet child({ props })}
	    <Button
		variant="outline"
		class="w-full justify-stretch"
		{...props}
		role="combobox"
		aria-expanded={open}
	    >
		{selectedValue || "Select ..."}
		<ChevronsUpDownIcon class="ms-2 size-4 shrink-0 opacity-50" />
	    </Button>
	{/snippet}
    </Popover.Trigger>
    <Popover.Content class="w-fit p-0">
	<Command.Root>
	    <Command.Input placeholder="Search ..." />
	    <Command.List>
		<Command.Empty>No values!</Command.Empty>
		<Command.Group>
		    {#each data as item}
			<Command.Item
			    value={createValue(item)}
			    onSelect={() => {
				value = createValue(item);
				closeAndFocusTrigger();
			    }}
			>
			    <CheckIcon
				class={cn(
				"me-2 size-4",
				value !== createValue(item) && "text-transparent"
				)}
			    />
			    {createLabel(item)}
			</Command.Item>
		    {/each}
		</Command.Group>
	    </Command.List>
	</Command.Root>
    </Popover.Content>
</Popover.Root>
