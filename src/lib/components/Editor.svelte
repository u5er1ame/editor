<script lang="ts">
import { registerToolbarItem } from "@svar-ui/svelte-toolbar";
import { Editor, registerEditorItem } from "@svar-ui/svelte-editor";
// import Button from '$lib/components/svar/Button.svelte';
import { Button, Text } from "@svar-ui/svelte-core";
import * as Dialog from "./ui/dialog";
import * as Field from "./ui/field"

import TestEditorItem from './TestEditorItem.svelte';
import Checkbox from "./ui/checkbox/checkbox.svelte";
import { Input } from "./ui/input";
import Select from "$lib/components/Select.svelte";
import { getTable } from "$lib/db.remote";

let { onsave, onclose, show=$bindable(false), values=$bindable(null), config, ...rest } = $props();

$inspect("editor",values);
registerEditorItem('text', TestEditorItem);
registerToolbarItem('dialog-close', Dialog.Close);
// registerToolbarItem('button', Button);
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
	    <Dialog.Content class="size-fit"
		onOpenAutoFocus={(e: Event) => {
		e.preventDefault();
		}}
	    >
		<Dialog.Header>
		    <Dialog.Title>Edit record</Dialog.Title>
		</Dialog.Header>
		{#each config as fieldConf}
		    <Field.Field class="size-full">
			<Field.Content>
			    {#if fieldConf.label}
				<Field.Label>{fieldConf.label}</Field.Label>
			    {/if}
			    {#if fieldConf.editor == 'none'}
				<div class="size-full text-stone-500">
				    {values[fieldConf.id]}
				</div>
			    {:else}
				{@const Component = editors[fieldConf.editor]}
				{#if fieldConf.fetchTable}
				    {@const data = (await getTable(fieldConf.fetchTable)).map(i=>}
				    <Component
					bind:value={values[fieldConf.id]}
					data={data?data:[]}
					{fieldConf}
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
			    {/if}
			</Field.Content>
		    </Field.Field>
		{/each}
	    </Dialog.Content>
	</Dialog.Portal>
    </Dialog.Root>
{/if}
