<script lang="ts">

	import Button from '$lib/components/ui/button/button.svelte';
	import Input from '$lib/components/ui/input/input.svelte';
	import Textarea from '$lib/components/ui/textarea/textarea.svelte';
	import * as Dialog from '$lib/components/ui/dialog';
	import * as Field from '$lib/components/ui/field';
	import { toast } from 'svelte-sonner';

	let {
		open = $bindable(false),
		x,
		y,
		zoneId = null,
		zoneLabel = null,
		onCreated,
		onClose
	}: {
		open?: boolean;
		x: number | null;
		y: number | null;
		zoneId?: string | null;
		zoneLabel?: string | null;
		onCreated?: (point: {
			id: string;
			description: string;
			photo: string | null;
			x: number;
			y: number;
			zone_id: string | null;
		}) => void;
		onClose?: () => void;
	} = $props();

	let description = $state('');
	let imageFile = $state<File | null>(null);
	let submitting = $state(false);
	let fileInput = $state<HTMLInputElement | null>(null);


	function reset() {
		description = '';
		imageFile = null;
		if (fileInput) fileInput.value = '';
	}

	function close() {
		if (submitting) return;
		open = false;
		reset();
		onClose?.();
	}

	function chooseImage(event: Event) {
		const input = event.currentTarget as HTMLInputElement;
		imageFile = input.files?.[0] ?? null;
	}

	async function submit() {
		if (x === null || y === null) {
			toast.error('Choose a point on the map first');
			return;
		}
		if (!description.trim()) {
			toast.error('Description is required');
			return;
		}

		submitting = true;
		try {
			const form = new FormData();
			form.set('description', description.trim());
			form.set('x', String(x));
			form.set('y', String(y));
			if (zoneId) form.set('zone_id', zoneId);
			if (imageFile) form.set('photo', imageFile);

			const response = await fetch('/api/v1/search-points', { method: 'POST', body: form });
			const result = await response.json().catch(() => ({}));
			if (!response.ok) throw new Error(result.message ?? 'Failed to create searchable point');

			onCreated?.(result.point);
			toast.success('Searchable point created');
			open = false;
			reset();
		} catch (cause) {
			toast.error(cause instanceof Error ? cause.message : 'Failed to create searchable point');
		} finally {
			submitting = false;
		}
	}
</script>

<Dialog.Root bind:open onOpenChange={(value) => !value && close()}>
	<Dialog.Content class="max-w-lg">
		<Dialog.Header>
			<Dialog.Title>Add searchable point</Dialog.Title>
		</Dialog.Header>

		<form class="space-y-4" onsubmit={(event) => { event.preventDefault(); submit(); }}>
			<Field.Field>
				<Field.Content>
					<Field.Label>Description</Field.Label>
					<Textarea bind:value={description} required rows={4} placeholder="Describe what can be found at this point" />
				</Field.Content>
			</Field.Field>

			<Field.Field>
				<Field.Content>
					<Field.Label>Position</Field.Label>
					<div class="grid grid-cols-2 gap-2">
						<Input value={x ?? ''} readonly aria-label="X coordinate" />
						<Input value={y ?? ''} readonly aria-label="Y coordinate" />
					</div>
					{#if zoneLabel}
						<p class="text-sm text-muted-foreground">Zone: {zoneLabel}</p>
					{:else}
						<p class="text-sm text-muted-foreground">No zone detected</p>
					{/if}
				</Field.Content>
			</Field.Field>

			<Field.Field>
				<Field.Content>
					<Field.Label>Photo (optional)</Field.Label>
					<input bind:this={fileInput} type="file" accept="image/jpeg,image/png,image/webp,image/gif" onchange={chooseImage} />
					{#if imageFile}
						<p class="text-sm text-muted-foreground">{imageFile.name}</p>
					{/if}
				</Field.Content>
			</Field.Field>

			<div class="flex justify-end gap-2">
				<Button type="button" variant="outline" onclick={close} disabled={submitting}>Cancel</Button>
				<Button type="submit" disabled={submitting}>{submitting ? 'Creating…' : 'Create point'}</Button>
			</div>
		</form>
	</Dialog.Content>
</Dialog.Root>
