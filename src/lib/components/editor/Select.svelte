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
    data: unknown[],
    props?: any,
    placeholder?: string,
    id: string,
};
let {
    open = $bindable(false),
    value = $bindable(),
    props,
    data = [],
    placeholder,
    id="editor-select",
    ...restProps
}: SelectProps = $props();

function createLabel(item: any) {
        return item[props.labelKey]
}

function createValue(item: any) {
	return item[props.valueKey]
}

// svelte-ignore state_referenced_locally
let val = $derived(value?value[props.valueKey]:undefined);
const label = $derived.by(()=>{
    if (val == undefined) { return placeholder ?? "Select"; }
    const hasValue: any = data.find((item: any)=>{ return item[props.valueKey] == val });
    if (hasValue == undefined) return "Cant find value";
    return hasValue[props.labelKey] ?? placeholder ?? "Select"
});
// $effect(()=>{
//     value = revertItem(val)
// });
</script>

    <Select.Root type="single" {open} bind:value={val} {...restProps} >
	<Select.Trigger class="w-full data-[state=open]:border-active data-[placeholder]:text-sidebar-accent-foreground" {id}>
	    {label}
	</Select.Trigger>
	<Select.Content>
	    {#each data as item}
		<Select.Item value={createValue(item)} label={createLabel(item)}/>
	    {/each}
	</Select.Content>
    </Select.Root>
