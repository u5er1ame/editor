<script lang="ts">
import { registerToolbarItem } from "@svar-ui/svelte-toolbar";
import { Editor, registerEditorItem } from "@svar-ui/svelte-editor";
import type { Component, SvelteComponent } from 'svelte';
// import Button from '$lib/components/svar/Button.svelte';
import { Button, Text } from "@svar-ui/svelte-core";
import * as Dialog from "./ui/dialog";
import * as Field from "./ui/field"

import TestEditorItem from './TestEditorItem.svelte';
import Checkbox from "./ui/checkbox/checkbox.svelte";
import { Input } from "./ui/input";
	import { Select } from "./ui/select";

let { onsave, onclose, show=$bindable(false), values, config, ...rest } = $props();

$inspect("editor",values,config);
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
<Dialog.Root bind:open={show}
    onOpenChange={(e)=>{ if(!e) {
	show = false;
	onclose?.(values);
	values = null;
    }
    }}>
    <Dialog.Portal>
	<Dialog.Overlay />
	<Dialog.Content
	    onOpenAutoFocus={(e: Event) => {
	    e.preventDefault();
	    }}
	>
	<Dialog.Header>
	    <Dialog.Title>Edit record</Dialog.Title>
	</Dialog.Header>
	    <form>
		<Field.Field>
		</Field.Field>
	    </form>
	</Dialog.Content>
    </Dialog.Portal>
</Dialog.Root>
