<script lang="ts">
	import Checkbox from '$lib/components/ui/checkbox/checkbox.svelte';

	let {
		editor,
		onsave,
		oncancel,
		onapply,
		...rest
	}: {
		editor: {
			id: string | number;
			column: string | number;
			value?: any;
			renderedValue?: any;
			config?: { [key: string]: any };
		};
		onsave?: (ignoreFocus?: boolean) => void;
		oncancel?: () => void;
		onapply?: (value: any) => void;
	} = $props();

	let checked = $state(editor.value ?? false);

	function handleChange(newChecked: boolean | 'indeterminate') {
		checked = newChecked === 'indeterminate' ? false : newChecked;
		onapply?.(checked);
		onsave?.();
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			oncancel?.();
		}
	}
</script>

<div class="flex size-full items-center p-1" onkeydown={handleKeydown} role="button" tabindex="-1">
	<Checkbox {checked} onCheckedChange={handleChange} autofocus />
</div>
