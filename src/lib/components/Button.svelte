<script lang="ts">
    import type { Snippet } from "svelte";
    import type { HTMLButtonAttributes, DOMAttributes } from "svelte/elements";
    import { clsx } from 'clsx';
    import { twMerge } from 'tailwind-merge';

    type Props = {
	children?: Snippet<[object | undefined]>
    } & HTMLButtonAttributes & DOMAttributes<HTMLButtonElement>;

    const defaultClass = clsx(['p-2', 'rounded-md', 'flex', 'flex-row', 'justify-center'])

    let { children, class: className=defaultClass, title, onclick, ...rest }: Props = $props();

    // svelte-ignore state_referenced_locally
        className = twMerge(clsx(defaultClass, className));
</script>

<button {title} {onclick} {...rest} class={className}>
    {@render children?.()}
</button>

<style>
    button {
        cursor: pointer;
	background-color: var(--xy-controls-button-background-color, var(--xy-controls-button-background-color-default));
	box-shadow: var(--shadow-sm);
	color: var(--color, var(--xy-controls-button-color-default));
    }
    button:hover {
        cursor: pointer;
	background-color: var(--xy-controls-button-background-color-hover, var(--xy-controls-button-background-color-hover-default));
    }
</style>
