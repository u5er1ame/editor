<script lang="ts" module>
export type Item = {
    label: string,
    value: string
}
</script>

<script lang="ts">
import * as Select from "$lib/components/ui/select";

type SelectProps = {
    open?: boolean,
    onOpenChange?: (open: boolean) => void,
    value: any,
    data: Item[],
    placeholder?: string,
    id: string,
};
let {
    open = $bindable(false),
    value = $bindable(),
    data = [],
    placeholder,
    id,
    ...restProps
}: SelectProps = $props();

const label = $derived.by(()=>{
    return (data.find((item: Item)=>item.value == val)?.label ?? placeholder ?? "Select")
});

let val = $state(undefined);
$effect(()=>{
    value = val
});
</script>

    <Select.Root type="single" {open} bind:value={val} {...restProps} >
	<Select.Trigger  class="w-full" {id}>
	    {label}
	</Select.Trigger>
	<Select.Content>
	    {#each data as item}
		<Select.Item {...item}/>
	    {/each}
	</Select.Content>
    </Select.Root>
