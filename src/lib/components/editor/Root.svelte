<script lang="ts">
import * as Dialog from "$lib/components/ui/dialog";
import * as Field from "$lib/components/ui/field"

import Checkbox from "$lib/components/ui/checkbox/checkbox.svelte";
import { Input } from "$lib/components/ui/input";
import Select from "$lib/components/editor/Select.svelte";
import Text from "$lib/components/editor/Text.svelte";
import { getTable } from "$lib/db.remote";
import Button from "$lib/components/ui/button/button.svelte"
	import { enhance } from "$app/forms";

let { onsave, onclose, show=$bindable(false), values=$bindable(null), config, ...rest } = $props();

const editors = {
    text: Input,
    select: Select,
    combo: Select,
    checkbox: Checkbox,
    none: Text,
}

</script>

{#if values}
    <Dialog.Root bind:open={show}
	onOpenChange={(e)=>{ if(!e) {
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
		<form use:enhance method="POST" action="?/editor" class="size-full flex flex-1 flex-col gap-2">
		    <Field.Set class="size-full">
			{#each config as fieldConf}
			    <Field.Field class="size-full">
				<Field.Content>
				    {#if fieldConf.label}
					<Field.Label>{fieldConf.label}</Field.Label>
				    {/if}
				    {@const Component = editors[fieldConf.editor]}
				    {#if fieldConf.props?.fetchTable}
					{@const data = await getTable(fieldConf.props.fetchTable)}
					<Component
					    bind:value={values[fieldConf.id]}
					    data={data?data:[]}
					    props={fieldConf.props}
					    {...rest}
					/>
				    {:else}
					<Component
					    bind:value={values[fieldConf.id]}
					    data={[]}
					    label={fieldConf.label}
					    {fieldConf}
					    {...rest}
					/>
				    {/if}
				    <Field.Error></Field.Error>
				</Field.Content>
			    </Field.Field>
			{/each}
			<Button type="submit" variant="default" class="hover:bg-emerald-300 cursor-pointer" title="Save">Save</Button>
		    </Field.Set>
		</form>
	    </Dialog.Content>
	</Dialog.Portal>
    </Dialog.Root>
{/if}
