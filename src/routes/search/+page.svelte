<script lang="ts">
	import { toast } from 'svelte-sonner';
	import { Input } from '$lib/components/ui/input';
	import Button from '$lib/components/ui/button/button.svelte';
	import Badge from '$lib/components/ui/badge/badge.svelte';
	import Spinner from '$lib/components/ui/spinner/spinner.svelte';
	import * as m from '$lib/paraglide/messages.js';

	type SearchPointResult = {
		point: {
			id: string;
			description: string;
			photo: string | null;
			x: number;
			y: number;
			zone_id: string | null;
		};
		score: number;
		matchedBy: 'text' | 'image';
	};

	let query = $state('');
	let results = $state<SearchPointResult[]>([]);
	let loading = $state(false);
	let imageFile = $state<File | null>(null);
	let fileInput = $state<HTMLInputElement | null>(null);

	const exampleQueries = [
		{ text: 'сломан свет', label: 'Broken light (RU)' },
		{ text: 'broken light', label: 'Broken light (EN)' },
		{ text: 'автомат выбивает', label: 'Breaker trips (RU)' },
		{ text: 'не работает розетка', label: 'Outlet broken (RU)' }
	];

	function handleImageSelect(event: Event) {
		const input = event.currentTarget as HTMLInputElement;
		imageFile = input.files?.[0] ?? null;
	}

	async function handleSearch() {
		if (!query.trim() && !imageFile) {
			toast.error('Enter text or choose an image');
			return;
		}

		loading = true;
		results = [];
		try {
			const form = new FormData();
			if (query.trim()) form.set('query_text', query.trim());
			if (imageFile) form.set('image', imageFile);
			form.set('limit', '10');
			form.set('threshold', '0.3');

			const response = await fetch('/api/v1/search-points/search', {
				method: 'POST',
				body: form
			});
			const payload = await response.json().catch(() => ({}));
			if (!response.ok) throw new Error(payload.message ?? 'Search failed');

			results = payload.results ?? [];
			if (!results.length) toast.info('No searchable points found');
		} catch (cause) {
			toast.error(cause instanceof Error ? cause.message : 'Search failed');
		} finally {
			loading = false;
		}
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Enter') handleSearch();
	}

	function selectExample(text: string) {
		query = text;
		void handleSearch();
	}

	function clearImage() {
		imageFile = null;
		if (fileInput) fileInput.value = '';
	}
</script>

<div class="container mx-auto max-w-4xl p-6">
	<div class="mb-6">
		<h1 class="text-3xl font-bold">🔍 {m.nav_search()}</h1>
		<p class="mt-2 text-muted-foreground">Find the closest searchable points by text, image, or both.</p>
	</div>

	<div class="mb-8 rounded-lg border p-4">
		<div class="flex gap-3">
			<Input
				bind:value={query}
				onkeydown={handleKeydown}
				placeholder="Describe what you are looking for"
				class="flex-1 text-lg" />
			<Button onclick={handleSearch} disabled={loading} size="lg">
				{#if loading}<Spinner size="4" class="mr-2" />{/if}
				{m.action_search()}
			</Button>
		</div>

		<div class="mt-3 flex flex-wrap items-center gap-2">
			<input
				bind:this={fileInput}
				type="file"
				accept="image/jpeg,image/png,image/webp,image/gif"
				onchange={handleImageSelect} />
			{#if imageFile}
				<Badge variant="secondary">{imageFile.name}</Badge>
				<Button variant="outline" size="sm" onclick={clearImage}>Remove image</Button>
			{/if}
		</div>

		<div class="mt-3 flex flex-wrap gap-2">
			<span class="text-sm text-muted-foreground">Examples:</span>
			{#each exampleQueries as example}
				<button
					class="rounded-full bg-muted px-3 py-1 text-xs transition-colors hover:bg-muted/80"
					onclick={() => selectExample(example.text)}>{example.label}</button>
			{/each}
		</div>
	</div>

	{#if results.length}
		<section class="space-y-4">
			<h2 class="text-lg font-semibold">Found {results.length} point{results.length === 1 ? '' : 's'}</h2>
			{#each results as result, index}
				<article class="rounded-lg border p-4 transition-colors hover:bg-muted/50">
					<div class="mb-2 flex items-center gap-2">
						<span class="text-2xl font-bold text-muted-foreground">{index + 1}</span>
						<Badge>{(result.score * 100).toFixed(0)}% match</Badge>
						<Badge variant="secondary">{result.matchedBy}</Badge>
					</div>
					<p class="text-lg">{result.point.description}</p>
					<p class="mt-2 text-sm text-muted-foreground">
						📍 x: {result.point.x.toFixed(2)}, y: {result.point.y.toFixed(2)}
						{#if result.point.zone_id} · {result.point.zone_id}{/if}
					</p>
				</article>
			{/each}
		</section>
	{:else if !loading && (query || imageFile)}
		<div class="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
			No searchable points matched your input.
		</div>
	{/if}

	<section class="mt-8 rounded-lg bg-muted p-4 text-sm text-muted-foreground">
		<h2 class="mb-2 font-medium text-foreground">How search works</h2>
		<p>Text and image queries search separate text and image vectors in the same embedding space. Results are merged into one result per stored map point.</p>
	</section>
</div>
