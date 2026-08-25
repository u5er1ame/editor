<script lang="ts">
	import { onMount } from 'svelte';
	import { toast } from 'svelte-sonner';
	import { Input } from '$lib/components/ui/input';
	import Button from '$lib/components/ui/button/button.svelte';
	import Badge from '$lib/components/ui/badge/badge.svelte';
	import Spinner from '$lib/components/ui/spinner/spinner.svelte';
	import ReportUpload from '$lib/components/ReportUpload.svelte';
	import * as m from '$lib/paraglide/messages.js';

	let query = $state('');
	let results: any[] = $state([]);
	let loading = $state(false);
	let showUpload = $state(false);
	let recentReports: any[] = $state([]);

	// Example queries for quick testing
	const exampleQueries = [
		{ text: 'сломан свет', label: 'Broken light (RU)' },
		{ text: 'broken light', label: 'Broken light (EN)' },
		{ text: 'Макдоналдс', label: 'McDonalds (RU)' },
		{ text: 'автомат выбивает', label: 'Breaker trips (RU)' },
		{ text: 'не работает розетка', label: 'Outlet broken (RU)' },
		{ text: 'panel short circuit', label: 'Short circuit (EN)' }
	];

	onMount(() => {
		loadRecentReports();
	});

	async function loadRecentReports() {
		try {
			const res = await fetch('/api/v1/reports?limit=5');
			if (res.ok) {
				const data = await res.json();
				recentReports = data.reports || [];
			}
		} catch (e) {
			console.warn('Failed to load recent reports:', e);
		}
	}

	async function handleSearch() {
		if (!query.trim()) {
			toast.error('Please enter a search query');
			return;
		}

		loading = true;
		results = [];

		try {
			const res = await fetch('/api/v1/search', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					query_text: query,
					limit: 10,
					threshold: 0.3
				})
			});

			if (!res.ok) {
				const error = await res.json();
				throw new Error(error.message || 'Search failed');
			}

			const data = await res.json();
			results = data.results || [];

			if (results.length === 0) {
				toast.info('No results found');
			}
		} catch (e: any) {
			toast.error('Search failed: ' + e.message);
		} finally {
			loading = false;
		}
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter') {
			handleSearch();
		}
	}

	function getScoreColor(score: number) {
		if (score >= 0.8) return 'default';
		if (score >= 0.6) return 'secondary';
		return 'outline';
	}

	function getMatchTypeBadge(type: string) {
		switch (type) {
			case 'vector':
				return { variant: 'default' as const, label: 'Semantic' };
			case 'text':
				return { variant: 'secondary' as const, label: 'Text' };
			case 'alias':
				return { variant: 'outline' as const, label: 'Alias' };
			default:
				return { variant: 'outline' as const, label: type };
		}
	}

	function getStatusColor(status: string) {
		switch (status) {
			case 'open':
				return 'destructive';
			case 'in_progress':
				return 'secondary';
			case 'resolved':
				return 'default';
			default:
				return 'outline';
		}
	}

	function handleReportCreated() {
		loadRecentReports();
		toast.success('Report created! Embedding will be generated shortly.');
	}
</script>

<div class="container mx-auto max-w-4xl p-6">
	<div class="mb-6 flex items-center justify-between">
		<h1 class="text-3xl font-bold">🔍 {m.nav_search()}</h1>
		<Button onclick={() => (showUpload = true)}>
			<span class="mr-2">📸</span>
			{m.report_upload()}
		</Button>
	</div>

	<!-- Search Input -->
	<div class="mb-6">
		<div class="flex gap-3">
			<Input
				bind:value={query}
				onkeydown={handleKeydown}
				placeholder={m.search_placeholder()}
				class="flex-1 text-lg" />
			<Button onclick={handleSearch} disabled={loading} size="lg">
				{#if loading}
					<Spinner size="4" class="mr-2" />
				{/if}
				{m.action_search()}
			</Button>
		</div>

		<!-- Example Queries -->
		<div class="mt-3 flex flex-wrap gap-2">
			<span class="text-sm text-muted-foreground">Quick search:</span>
			{#each exampleQueries as example}
				<button
					class="rounded-full bg-muted px-3 py-1 text-xs transition-colors hover:bg-muted/80"
					onclick={() => {
						query = example.text;
						handleSearch();
					}}>
					{example.label}
				</button>
			{/each}
		</div>
	</div>

	<!-- Results -->
	{#if results.length > 0}
		<div class="mb-8 space-y-4">
			<h2 class="text-lg font-semibold">
				Found {results.length} result{results.length === 1 ? '' : 's'}
			</h2>

			{#each results as result, idx}
				{@const matchBadge = getMatchTypeBadge(result.matchType)}
				<div class="rounded-lg border p-4 transition-colors hover:bg-muted/50">
					<div class="mb-2 flex items-start justify-between">
						<div class="flex items-center gap-2">
							<span class="text-2xl font-bold text-muted-foreground">
								{idx + 1}
							</span>
							<Badge variant={getScoreColor(result.score)}>
								{(result.score * 100).toFixed(0)}% match
							</Badge>
							<Badge variant={matchBadge.variant}>
								{matchBadge.label}
							</Badge>
						</div>
						<Badge variant={getStatusColor(result.record?.status)}>
							{result.record?.status || 'unknown'}
						</Badge>
					</div>

					<p class="mb-2 text-lg">
						{result.record?.description || 'No description'}
					</p>

					{#if result.locationPath}
						<p class="text-sm text-muted-foreground">
							📍 {result.locationPath}
						</p>
					{/if}

					<div class="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
						<span>ID: {result.record?.id}</span>
						{#if result.record?.created_at}
							<span>Created: {new Date(result.record.created_at).toLocaleDateString()}</span>
						{/if}
						{#if result.record?.created_by}
							<span>By: {result.record.created_by}</span>
						{/if}
					</div>
				</div>
			{/each}
		</div>
	{:else if !loading && query}
		<div class="mb-8 rounded-lg border border-dashed p-8 text-center">
			<p class="text-lg text-muted-foreground">{m.search_no_results()}</p>
			<p class="mt-2 text-sm text-muted-foreground">
				Try a different search term or check if the embedding service is running.
			</p>
		</div>
	{/if}

	<!-- Recent Reports -->
	{#if recentReports.length > 0}
		<section class="rounded-lg border p-4">
			<h2 class="mb-4 text-lg font-semibold">Recent Reports</h2>
			<div class="space-y-3">
				{#each recentReports as report}
					<div class="flex items-start justify-between rounded-md bg-muted/50 p-3">
						<div>
							<p class="text-sm">{report.description}</p>
							<div class="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
								<span>{new Date(report.created_at).toLocaleString()}</span>
								<span>•</span>
								<span>{report.created_by || 'Unknown'}</span>
							</div>
						</div>
						<Badge variant={getStatusColor(report.status)} class="ml-2">
							{report.status}
						</Badge>
					</div>
				{/each}
			</div>
		</section>
	{/if}

	<!-- Info -->
	<section class="mt-8 rounded-lg bg-muted p-4">
		<h3 class="mb-2 font-medium">How Search Works</h3>
		<ul class="space-y-1 text-sm text-muted-foreground">
			<li>
				• <strong>Semantic Search:</strong>
				 Uses Jina embeddings to find meaning-similar reports
			</li>
			<li>
				• <strong>Text Search:</strong>
				 Falls back to exact text matching if embeddings fail
			</li>
			<li>
				• <strong>Alias Search:</strong>
				 Matches brand names, typos, and translations (RU/EN)
			</li>
			<li>
				• <strong>Multilingual:</strong>
				 Works across Russian and English queries
			</li>
			<li>
				• <strong>Multimodal:</strong>
				 Photos are embedded in the same space as text
			</li>
		</ul>
	</section>
</div>

<!-- Report Upload Dialog -->
<ReportUpload bind:open={showUpload} onSuccess={handleReportCreated} />
