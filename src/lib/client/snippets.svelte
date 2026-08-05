<script module>
import { ControlButton, type ControlButtonProps } from "@xyflow/svelte";

export { DumbButton, Selectable, Lock, ResizeButton, FitViewButton, DeleteButton };

</script>
{#snippet DumbButton(props: ControlButtonProps)}
    <ControlButton onclick={(e)=>console.log(e)} {...props} type="button">
        PLACEHOLDER
    </ControlButton>
{/snippet}

{#snippet ResizeButton(props: ControlButtonProps & { active?: boolean })}
    <ControlButton {...props} type="button">
        {#if props.active}
            <span class="iconify solar--text-selection-bold-duotone"></span>
        {:else}
            <span class="iconify material-symbols--resize-rounded"></span>
        {/if}
    </ControlButton>
{/snippet}

{#snippet Selectable(props: ControlButtonProps )}
    <ControlButton {...props} type="button">
        <span class="iconify material-symbols--deselect-sharp"></span>
    </ControlButton>
{/snippet}
{#snippet Lock(props: ControlButtonProps )}
    <ControlButton {...props} type="button">
        <span class="iconify material-symbols--drag-pan-rounded"></span>
    </ControlButton>
{/snippet}

{#snippet DeleteButton(props: ControlButtonProps)}
    <ControlButton {...props} type="button">
        <span class="iconify solar--trash-bin-2-bold-duotone"></span>
    </ControlButton>
{/snippet}

{#snippet FitViewButton(props: ControlButtonProps)}
    <ControlButton {...props}  type="button">
        <span class="iconify solar--full-screen-line-duotone"></span>
    </ControlButton>
{/snippet}

<script lang="ts">
</script>
