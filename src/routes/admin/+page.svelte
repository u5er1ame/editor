<script lang="ts">
	import { onMount } from 'svelte';
	import { toast } from 'svelte-sonner';
	import Button from '$lib/components/ui/button/button.svelte';
	import Spinner from '$lib/components/ui/spinner/spinner.svelte';
	import Badge from '$lib/components/ui/badge/badge.svelte';

	let health: any = $state(null);
	let seedResult: any = $state(null);
	let geometryResult: any = $state(null);
	let loading = $state(false);
	let seeding = $state(false);
	let seedingGeometry = $state(false);

	onMount(() => {
		checkHealth();
	});

	async function checkHealth() {
		loading = true;
		try {
			const res = await fetch('/api/v1/health');
			health = await res.json();
		} catch (e: any) {
			toast.error('Health check failed: ' + e.message);
		} finally {
			loading = false;
		}
	}

	async function seedDatabase(action: string) {
		seeding = true;
		try {
			const res = await fetch('/api/v1/seed', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ action })
			});
			seedResult = await res.json();
			toast.success(`Seed completed: ${action}`);
		} catch (e: any) {
			toast.error('Seed failed: ' + e.message);
		} finally {
			seeding = false;
		}
	}

	async function seedGeometry(action: string) {
		seedingGeometry = true;
		try {
			const res = await fetch('/api/v1/map/seed', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ action })
			});
			geometryResult = await res.json();
			toast.success(`Geometry seed completed: ${action}`);
		} catch (e: any) {
			toast.error('Geometry seed failed: ' + e.message);
		} finally {
			seedingGeometry = false;
		}
	}

	function getStatusColor(status: string) {
		switch (status) {
			case 'connected':
			case 'healthy':
				return 'success';
			case 'degraded':
			case 'unavailable':
				return 'secondary';
			case 'error':
			case 'disconnected':
				return 'destructive';
			default:
				return 'outline';
		}
	}
</script>

<div class="container mx-auto max-w-4xl p-6">
	<h1 class="mb-6 text-3xl font-bold">System Admin</h1>

	<!-- Health Status -->
	<section class="mb-8 rounded-lg border p-6">
		<div class="mb-4 flex items-center justify-between">
			<h2 class="text-xl font-semibold">Service Health</h2>
			<Button onclick={checkHealth} disabled={loading} variant="outline" size="sm">
				{#if loading}
					<Spinner size="4" class="mr-2" />
				{/if}
				Refresh
			</Button>
		</div>

		{#if health}
			<div class="mb-4">
				<Badge variant={getStatusColor(health.status)}>
					{health.status?.toUpperCase()}
				</Badge>
				<span class="ml-2 text-sm text-foreground">
					{health.timestamp}
				</span>
			</div>

			<div class="grid gap-4 md:grid-cols-3">
				<!-- SurrealDB -->
				<div class="rounded-lg border p-4">
					<h3 class="mb-2 font-medium">SurrealDB</h3>
					<Badge variant={getStatusColor(health.services?.surrealdb?.status)}>
						{health.services?.surrealdb?.status || 'unknown'}
					</Badge>
					{#if health.services?.surrealdb?.tables}
						<p class="mt-2 text-sm text-foreground">
							{health.services.surrealdb.tables} tables
						</p>
					{/if}
					{#if health.services?.surrealdb?.error}
						<p class="mt-2 text-sm text-destructive">
							{health.services.surrealdb.error}
						</p>
					{/if}
				</div>

				<!-- Embedding Service -->
				<div class="rounded-lg border p-4">
					<h3 class="mb-2 font-medium">Embedding Service</h3>
					<Badge variant={getStatusColor(health.services?.embedding?.status)}>
						{health.services?.embedding?.status || 'unknown'}
					</Badge>
					{#if health.services?.embedding?.dimension}
						<p class="mt-2 text-sm text-foreground">
							Dimension: {health.services.embedding.dimension}
						</p>
					{/if}
					{#if health.services?.embedding?.error}
						<p class="mt-2 text-sm text-destructive">
							{health.services.embedding.error}
						</p>
					{/if}
				</div>

				<!-- Node-RED -->
				<div class="rounded-lg border p-4">
					<h3 class="mb-2 font-medium">Node-RED</h3>
					<Badge variant={getStatusColor(health.services?.nodered?.status)}>
						{health.services?.nodered?.status || 'unknown'}
					</Badge>
					{#if health.services?.nodered?.version}
						<p class="mt-2 text-sm text-foreground">
							v{health.services.nodered.version}
						</p>
					{/if}
				</div>
			</div>
		{:else if loading}
			<div class="flex items-center justify-center p-8">
				<Spinner size="8" />
			</div>
		{/if}
	</section>

	<!-- Seed Database -->
	<section class="mb-8 rounded-lg border p-6">
		<h2 class="mb-4 text-xl font-semibold">Seed Database</h2>
		<p class="mb-4 text-sm text-foreground">
			Add mock data to the database. This will generate real embeddings using the LM Studio endpoint.
		</p>

		<div class="flex flex-wrap gap-3">
			<Button onclick={() => seedDatabase('seed-all')} disabled={seeding} variant="default">
				{#if seeding}
					<Spinner size="4" class="mr-2" />
				{/if}
				Seed All Data
			</Button>
			<Button onclick={() => seedDatabase('seed-reports')} disabled={seeding} variant="outline">
				Seed Reports Only
			</Button>
			<Button onclick={() => seedDatabase('seed-aliases')} disabled={seeding} variant="outline">
				Seed Aliases Only
			</Button>
			<Button onclick={() => seedDatabase('backfill-embeddings')} disabled={seeding} variant="outline">
				Backfill Embeddings
			</Button>
			<Button onclick={() => seedDatabase('check')} disabled={seeding} variant="secondary">
				Check Status
			</Button>
		</div>

		{#if seedResult}
			<div class="mt-4 rounded-lg bg-muted p-4">
				<h3 class="mb-2 font-medium">Result:</h3>
				<pre class="overflow-auto text-sm">{JSON.stringify(seedResult, null, 2)}</pre>
			</div>
		{/if}
	</section>

	<!-- Seed Geometry -->
	<section class="mb-8 rounded-lg border p-6">
		<h2 class="mb-4 text-xl font-semibold">Seed Map Geometry</h2>
		<p class="mb-4 text-sm text-foreground">
			Add geometry data to tables for the map view. This creates floor plans, areas, and room outlines.
		</p>

		<div class="flex flex-wrap gap-3">
			<Button onclick={() => seedGeometry('seed-geometry')} disabled={seedingGeometry} variant="default">
				{#if seedingGeometry}
					<Spinner size="4" class="mr-2" />
				{/if}
				Seed Geometry Data
			</Button>
			<Button onclick={() => seedGeometry('check-geometry')} disabled={seedingGeometry} variant="secondary">
				Check Geometry Status
			</Button>
		</div>

		{#if geometryResult}
			<div class="mt-4 rounded-lg bg-muted p-4">
				<h3 class="mb-2 font-medium">Geometry Result:</h3>
				<pre class="overflow-auto text-sm">{JSON.stringify(geometryResult, null, 2)}</pre>
			</div>
		{/if}
	</section>

	<!-- Quick Links -->
	<section class="rounded-lg border p-6">
		<h2 class="mb-4 text-xl font-semibold">Quick Links</h2>
		<div class="flex flex-wrap gap-3">
			<Button href="/" variant="outline">Tables View</Button>
			<Button href="/graph" variant="outline">Graph View</Button>
			<Button href="/map" variant="outline">Map View</Button>
			<Button href="/search" variant="outline">Search View</Button>
		</div>
	</section>
</div>
