<script lang="ts">
import { enhance } from "$app/forms";
import * as Dialog from "$lib/components/ui/dialog";
import * as Field from "$lib/components/ui/field"

import Checkbox from "$lib/components/ui/checkbox/checkbox.svelte";
import { Input } from "$lib/components/ui/input";
import Select from "$lib/components/editor/Select.svelte";
import Text from "$lib/components/editor/Text.svelte";
import Combo from "$lib/components/editor/Combo.svelte";
import { getDataClient } from "$lib/db.remote";
import Button from "$lib/components/ui/button/button.svelte"

let { onsave, onclose, show=$bindable(false), values=$bindable(null), config, fieldRef=$bindable(null), ...rest } = $props();

const editors = {
    text: Input,
    select: Select,
    combo: Combo,
    checkbox: Checkbox,
    none: Text,
}
function validationState(element, formData, action, cancel, submitter) {
    return async ({result, update})=>{
	console.log("result", result);
	show = false;
	await update(result);
    }
}
</script>

{#if values}
    <Dialog.Root bind:open={show}
	onOpenChange={(e)=>{
	if(!e) {
	    show = false;
	    onclose?.(values);
	    values = null;
	}
	}}>
	<Dialog.Portal>
	    <Dialog.Overlay />
	    <Dialog.Content class="size-fit "
		onOpenAutoFocus={(e: Event) => {
		    e.preventDefault();
		}}
	    >
		<Dialog.Header>
		    <Dialog.Title>Edit record</Dialog.Title>
		</Dialog.Header>
		<form use:enhance={validationState} method="POST" action="?/save" class="size-full flex flex-1 flex-col gap-2">
		    <Field.Set class="size-full">
			{#each config as fieldConf}
			    <Field.Field class="size-full">
				<Field.Content>
				    {#if fieldConf.label}
					<Field.Label>{fieldConf.label}</Field.Label>
				    {/if}
				    {@const Component = editors[fieldConf.editor]}
				    {#if fieldConf.props?.fetchTable}
					{@const data = await getDataClient(fieldConf.props.fetchTable)}
					<Component
					    bind:value={values[fieldConf.id]}
					    data={data?data:[]}
					    props={fieldConf.props}
					    name={fieldConf.id}
					    {...rest}
					/>
				    {:else}
					<Component
					    bind:value={values[fieldConf.id]}
					    data={[]}
					    label={fieldConf.label}
					    {fieldConf}
					    name={fieldConf.id}
					    {...rest}
					/>
				    {/if}
				    <Field.Error></Field.Error>
				</Field.Content>
			    </Field.Field>
			{/each}
			<Button type="submit" variant="default" class="hover:bg-hover cursor-pointer" title="Save">Save</Button>
		    </Field.Set>
		</form>
	    </Dialog.Content>
	</Dialog.Portal>
    </Dialog.Root>
{/if}
