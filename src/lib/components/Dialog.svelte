<script module>
import { Button } from "./ui/button";
import { Checkbox } from "./ui/checkbox";
import  Select  from "$lib/components/Select.svelte";
import { Input } from "./ui/input";

export type FormTypes = "input" | "select" | "button" | "checkbox";

export type FieldProps<T extends FormTypes> =
    T extends "input" ? typeof Input:
    T extends "select" ? typeof Select.Root:
    T extends "button" ? typeof Button:
    T extends "checkbox" ? typeof Checkbox:
    never;

export type Form<T extends FormTypes> = {
    [key: string]: {
	label: string,
	description?: string,
	type: T,
	fieldProps?: FieldProps<T>,
	errors?: { message?: string }[];
    }
};

export type Props = {
    open?: boolean,
    onsubmit: (values: {[key: string]: any}) => void,
    withCloseButton?: boolean,
    header?: string,
    footer?: string,
    form: Form<FormTypes>,
};
</script>

<script lang="ts">
import type { Component } from "svelte";

import * as Dialog from "./ui/dialog";
import * as Field from "./ui/field";


let {
    open = $bindable(false),
    onsubmit,
    withCloseButton = true,
    header = "",
    footer = "",
    form,
}: Props = $props();

let formData: {[key: string]: any} = {};
for (const k of Object.keys(form)) {
    formData[k] = null;
}

function submit(e: SubmitEvent) {
    e.preventDefault();
    open = !open;
    onsubmit(formData);
    Object.entries(form).forEach(([k,_])=>{
	formData[k] = undefined
    });
}

const field: { [key in FormTypes]: Component<typeof Input | typeof Select.Root | typeof Button | typeof Checkbox> } = {
    input: Input,
    select: Select,
    button: Button,
    checkbox: Checkbox,
}
</script>

<Dialog.Root {open} onOpenChange={()=>open=!open}>
    {#if withCloseButton}
	<Dialog.Close />
    {/if}
    <Dialog.Content>
	<Dialog.Header>
	    {header}
        </Dialog.Header>
	{#if form }
	    <form onsubmit={submit}>
		<Field.Group >
		    <!-- {#each form as item, j} -->
		    {#each Object.entries(form) as [key, data], i}
			{@const Component = field[data.type]}
			<Field.Field orientation="responsive">
			    <Field.Content>
				{#if data.label}
				    <Field.Label for={key}>
					{data.label}
				    </Field.Label>
				{/if}
				<Component bind:value={formData[key]} {...data.fieldProps} />
				{#if data.description}
				    <Field.Description>
					{data.description}
				    </Field.Description>
				{/if}
				{#if data.errors}
				    <Field.Error for={key} errors={data.errors}/>
				{/if}
			    </Field.Content >
			</Field.Field>
			<Field.Separator />
		    {/each}
		    <!-- {/each} -->
		    <Button type="submit">Submit</Button>
		</Field.Group >
	    </form>
	{/if}
    </Dialog.Content>
    <Dialog.Footer>
	{footer}
    </Dialog.Footer>
</Dialog.Root>
