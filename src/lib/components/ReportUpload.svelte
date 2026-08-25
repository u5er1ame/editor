<script lang="ts">
	import { toast } from 'svelte-sonner';
	import { Input } from '$lib/components/ui/input';
	import { Textarea } from '$lib/components/ui/textarea';
	import Button from '$lib/components/ui/button/button.svelte';
	import Badge from '$lib/components/ui/badge/badge.svelte';
	import Spinner from '$lib/components/ui/spinner/spinner.svelte';
	import * as Dialog from '$lib/components/ui/dialog';
	import * as Field from '$lib/components/ui/field';
	import * as Select from '$lib/components/ui/select';
	import { getDataClient } from '$lib/db.remote';
	import * as m from '$lib/paraglide/messages.js';

	let {
		open = $bindable(false),
		onSuccess
	}: {
		open?: boolean;
		onSuccess?: (report: any) => void;
	} = $props();

	let description = $state('');
	let selectedLocation = $state<string | undefined>(undefined);
	let imageFile: File | null = $state(null);
	let imagePreview = $state<string | null>(null);
	let uploading = $state(false);
	let fileInput: HTMLInputElement | null = $state(null);

	// Fetch locations for dropdown
	const locations = $derived.by(() => {
		const areas = getDataClient('area_name');
		const rooms = getDataClient('electric_rooms');
		const boards = getDataClient('boards');

		const items: { value: string; label: string; group: string }[] = [];

		if (areas.ready && areas.current) {
			for (const area of areas.current) {
				items.push({
					value: area.id?.toString() || '',
					label: area.name || 'Unknown',
					group: 'Areas'
				});
			}
		}

		if (rooms.ready && rooms.current) {
			for (const room of rooms.current) {
				items.push({
					value: room.id?.toString() || '',
					label: room.name || 'Unknown',
					group: 'Rooms'
				});
			}
		}

		if (boards.ready && boards.current) {
			for (const board of boards.current) {
				items.push({
					value: board.id?.toString() || '',
					label: board.name || 'Unknown',
					group: 'Boards'
				});
			}
		}

		return items;
	});

	function handleImageSelect(e: Event) {
		const input = e.target as HTMLInputElement;
		if (input.files && input.files[0]) {
			imageFile = input.files[0];
			const reader = new FileReader();
			reader.onload = (e) => {
				imagePreview = e.target?.result as string;
			};
			reader.readAsDataURL(imageFile);
		}
	}

	function removeImage() {
		imageFile = null;
		imagePreview = null;
		if (fileInput) {
			fileInput.value = '';
		}
	}

	async function handleSubmit() {
		if (!description.trim()) {
			toast.error('Please enter a description');
			return;
		}

		uploading = true;

		try {
			// Create the report
			const res = await fetch('/api/v1/reports', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					description: description.trim(),
					location_ids: selectedLocation ? [selectedLocation] : []
				})
			});

			if (!res.ok) {
				const error = await res.json();
				throw new Error(error.message || 'Failed to create report');
			}

			const report = await res.json();

			// Upload image if provided
			if (imageFile && report.id) {
				const formData = new FormData();
				formData.append('file', imageFile);
				formData.append('report_id', report.id.toString());

				const uploadRes = await fetch('/api/v1/reports/upload', {
					method: 'POST',
					body: formData
				});

				if (!uploadRes.ok) {
					console.warn('Image upload failed, but report was created');
				}
			}

			toast.success('Report created successfully');
			resetForm();
			onSuccess?.(report);
			open = false;
		} catch (e: any) {
			toast.error('Failed to create report: ' + e.message);
		} finally {
			uploading = false;
		}
	}

	function resetForm() {
		description = '';
		selectedLocation = undefined;
		imageFile = null;
		imagePreview = null;
	}
</script>

<Dialog.Root bind:open onOpenChange={(e) => { if (!e) resetForm(); }}>
	<Dialog.Content class="max-w-lg">
		<Dialog.Header>
			<Dialog.Title>{m.report_upload()}</Dialog.Title>
		</Dialog.Header>

		<form onsubmit={(e) => { e.preventDefault(); handleSubmit(); }} class="space-y-4">
			<!-- Description -->
			<Field.Field>
				<Field.Content>
					<Field.Label>{m.report_description()}</Field.Label>
					<Textarea
						bind:value={description}
						placeholder="Опишите проблему... / Describe the problem..."
						rows={3}
						required
					/>
				</Field.Content>
			</Field.Field>

			<!-- Location -->
			<Field.Field>
				<Field.Content>
					<Field.Label>Location (optional)</Field.Label>
					<Select.Root type="single" bind:value={selectedLocation}>
						<Select.Trigger class="w-full">
							{selectedLocation
								? locations.find(l => l.value === selectedLocation)?.label ?? 'Select location'
								: 'Select location'}
						</Select.Trigger>
						<Select.Content>
							{#each ['Areas', 'Rooms', 'Boards'] as group}
								{@const groupItems = locations.filter(l => l.group === group)}
								{#if groupItems.length > 0}
									<Select.Group>
										<Select.Label>{group}</Select.Label>
										{#each groupItems as location}
											<Select.Item value={location.value} label={location.label} />
										{/each}
									</Select.Group>
								{/if}
							{/each}
						</Select.Content>
					</Select.Root>
				</Field.Content>
			</Field.Field>

			<!-- Image Upload -->
			<Field.Field>
				<Field.Content>
					<Field.Label>{m.report_photo()} (optional)</Field.Label>
					<div class="flex items-center gap-3">
						<input
							bind:this={fileInput}
							type="file"
							accept="image/*"
							onchange={handleImageSelect}
							class="hidden"
							id="image-upload"
						/>
						<Button
							type="button"
							variant="outline"
							onclick={() => fileInput?.click()}
						>
							Choose Image
						</Button>
						{#if imageFile}
							<span class="text-sm text-muted-foreground">
								{imageFile.name}
							</span>
						{/if}
					</div>

					{#if imagePreview}
						<div class="relative mt-2">
							<img
								src={imagePreview}
								alt="Preview"
								class="max-h-48 rounded-lg object-cover"
							/>
							<button
								type="button"
								class="absolute top-2 right-2 rounded-full bg-destructive p-1 text-white hover:bg-destructive/80"
								onclick={removeImage}
							>
								✕
							</button>
						</div>
					{/if}
				</Field.Content>
			</Field.Field>

			<!-- Submit -->
			<div class="flex justify-end gap-3">
				<Button type="button" variant="outline" onclick={() => open = false}>
					{m.action_cancel()}
				</Button>
				<Button type="submit" disabled={uploading || !description.trim()}>
					{#if uploading}
						<Spinner size="4" class="mr-2" />
					{/if}
					{m.action_save()}
				</Button>
			</div>
		</form>
	</Dialog.Content>
</Dialog.Root>
