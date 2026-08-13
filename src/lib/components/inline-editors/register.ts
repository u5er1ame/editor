import { registerInlineEditor } from '@svar-ui/svelte-grid';
import type { Component } from 'svelte';
import SelectInlineEditor from './SelectInlineEditor.svelte';
import ComboInlineEditor from './ComboInlineEditor.svelte';
import CheckboxInlineEditor from './CheckboxInlineEditor.svelte';

export function registerInlineEditors() {
	// Register custom inline editors that fetch options async
	registerInlineEditor('select', SelectInlineEditor as Component<any>);
	registerInlineEditor('combo', ComboInlineEditor as Component<any>);
	registerInlineEditor('checkbox', CheckboxInlineEditor as Component<any>);
}
