<script lang="ts">
import { slide } from "svelte/transition";
import { type Node, ControlButton, NodeToolbar, Position, useNodes } from "@xyflow/svelte";

import * as Dialog from "$lib/components/ui/dialog";
import * as Input from "$lib/components/ui/input";
import * as Field from "$lib/components/ui/field";

import type { Board } from "$lib/server/schemas";
	import { twMerge } from "tailwind-merge";
	import { resizer } from "$lib/utils";

let { id, size, isVisible, editable=$bindable(), ...rest } =  $props();

const nodes = useNodes();

let unsaved_count = $state(0);

let open = $state(false);

let openDiag = $state(false);
let prompt = $state("");

async function addBoard(type?: string) {
    $effect.root(()=>{ unsaved_count++ });
    const uid = id.split(":")[1];
    type = type || "unsaved_boards";
    const child_id = [type, prompt, uid, unsaved_count].join("-");
    $resizer.set(child_id, false); // add to resizer list for toolbar (change later?)
    console.log("adding board", child_id, "to", id);
    // $effect.root(()=>{
        nodes.update((current)=>{
        const item: Node<{raw: Board}> = {
            id: child_id,
            type,
            parentId: id,
            expandParent: true,
            extent: "parent",
            position: { x: 0, y: 0 },
            width: 64,
            height: 64,
            data: {
                raw: {
                    name: prompt,
                    room: id
                }
            }
        }
            return [...current, item];
        });
        // nodes.set(nodes.current)
    // });
    // await tick();

    // nodes.update((current)=>current);
}

let errors: string | undefined = $state(undefined);
async function onsubmit(e: SubmitEvent) {
    e.preventDefault();
    await addBoard();
    openDiag = false;
    prompt = "";
}

 function editName(e: MouseEvent) {
    e.stopPropagation();
    editable=!editable
    // await tick();
    // if (editable) {
    //     editableInputRef?.focus();
    // }
}
</script>

<NodeToolbar {isVisible} offset={1} class="h-auto" position={Position.Right} align="start" nodeId={id}>
    <div class={twMerge("border-l flex flex-col gap-1 *:rounded-r-md items-start justify-baseline",open?"border-l-active":"border-l-destructive" )} in:slide={{ axis: "x" }} >
    <ControlButton title="Edit" onclick={()=>open=!open}>
        {#if !open}
            <span class="bg-destructive iconify solar--lock-password-bold-duotone"></span>
        {:else}
            <span class="text-active iconify solar--lock-password-unlocked-bold-duotone"></span>
        {/if}
    </ControlButton>
    {#if open}
        <div class="*:rounded-r-md flex flex-col gap-1" transition:slide={{ axis: "x" }}>
                <ControlButton title="Rename" onclick={editName}>
                    <span class="iconify solar--clapperboard-edit-bold-duotone"></span>
                </ControlButton>
                <ControlButton title="Add Board" onclick={()=>openDiag=true}>
                    <span class="iconify solar--clipboard-add-bold-duotone"></span>
                </ControlButton>
            </div>
    {/if}
    </div>
</NodeToolbar>
<NodeToolbar {isVisible} offset={1} class="h-auto" position={Position.Right} align="end" nodeId={id}>
    <div class="border-l border-l-active flex flex-col gap-1 *:rounded-r-md items-start justify-baseline" in:slide={{ axis: "x" }} >
        <ControlButton bgColor="var(--color-hover)" class="mt-auto " title="Layout">
            <span class="bg-primary iconify solar--widget-add-bold-duotone"></span>
        </ControlButton>
    </div>
</NodeToolbar>

<Dialog.Root open={openDiag} onOpenChange={()=>openDiag=!openDiag}>
    <Dialog.Close />
    <Dialog.Content>
        <Dialog.Header>
            Add new board?
        </Dialog.Header>
        <form {onsubmit}>
        <Field.Field  >
            <Field.Content>
                <Field.Label for="name">
                    name
                </Field.Label>
                <Input.Root id="name" placeholder="ЩР 1" class="w-full" bind:value={prompt} >
                </Input.Root>
                <Field.Description>
                    Enter board name
                </Field.Description>
            </Field.Content >
            <Field.Error for="name">
                {errors}
            </Field.Error>
        </Field.Field >
        </form>
    </Dialog.Content>
</Dialog.Root>
