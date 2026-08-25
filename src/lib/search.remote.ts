import { jsonify, surql, Table, RecordId } from 'surrealdb';
import { error } from '@sveltejs/kit';
import { getRequestEvent, query } from '$app/server';
import { env } from '$env/dynamic/private';
import z from 'zod/v4';
import { embeddingClient } from '$lib/server/embedding';
import type { SearchResult, SearchOptions } from '$lib/model/reports';

// ── Helpers ──────────────────────────────────────────────────────────

/** Ensure the DB connection is alive and ready */
async function getDb() {
	const { locals } = getRequestEvent();
	const db = locals.db.instance;
	if (!db.isConnected) error(500, 'DB not connected');
	await db.ready.catch(() => error(500, 'DB not ready'));
	return db;
}

// ── Report CRUD ─────────────────────────────────────────────────────

/**
 * Create a new report with optional image upload
 */
export const createReport = query(
	z.object({
		description: z.string().min(1),
		bucket_key: z.string().optional(),
		content_type: z.string().optional(),
		location_ids: z.array(z.string()).optional()
	}),
	async ({ description, bucket_key, content_type, location_ids }) => {
		const db = await getDb();
		const { locals } = getRequestEvent();

		// Create the report record
		const [report] = await db.query<[any]>(
			`CREATE reports SET
				description = $description,
				bucket_key = $bucket_key,
				content_type = $content_type,
				status = 'open',
				created_at = time::now(),
				created_by = $username`,
			{
				description,
				bucket_key: bucket_key || null,
				content_type: content_type || null,
				username: locals.db.username || 'unknown'
			}
		);

		if (!report) {
			return error(500, 'Failed to create report');
		}

		// Link to locations if provided
		if (location_ids && location_ids.length > 0) {
			for (const loc_id of location_ids) {
				await db.query(
					`RELATE $report->report_locations->$location SET confidence = 1.0`,
					{
						report: report.id,
						location: new RecordId(loc_id.split(':')[0], loc_id.split(':')[1])
					}
				);
			}
		}

		// Generate embedding for the description
		try {
			const vector = await embeddingClient.embedText(description);
			await db.query(
				`CREATE embeddings SET
					source_table = 'reports',
					source_id = $source_id,
					vector = $vector,
					text_content = $text,
					created_at = time::now()`,
				{
					source_id: report.id.toString(),
					vector,
					text: description
				}
			);
		} catch (e) {
			console.warn('Failed to generate embedding (non-fatal):', e);
			// Don't fail the report creation if embedding fails
		}

		return jsonify(report);
	}
);

/**
 * Update report status
 */
export const updateReportStatus = query(
	z.object({
		id: z.string(),
		status: z.enum(['open', 'in_progress', 'resolved'])
	}),
	async ({ id, status }) => {
		const db = await getDb();
		const { locals } = getRequestEvent();

		const recordId = new RecordId('reports', id.split(':')[1] ?? id);

		const updates: Record<string, any> = { status };

		if (status === 'resolved') {
			updates.resolved_at = new Date().toISOString();
			updates.resolved_by = locals.db.username || 'unknown';
		}

		const [result] = await db.query<[any]>(
			`UPDATE $id MERGE $updates`,
			{ id: recordId, updates }
		);

		return jsonify(result);
	}
);

// ── Search Operations ───────────────────────────────────────────────

/**
 * Search reports using vector similarity
 */
export const searchReports = query(
	z.object({
		query_text: z.string().min(1),
		limit: z.number().optional().default(10),
		threshold: z.number().optional().default(0.5)
	}),
	async ({ query_text, limit, threshold }) => {
		const db = await getDb();

		// Generate embedding for the search query
		let queryVector: number[];
		try {
			queryVector = await embeddingClient.embedText(query_text);
		} catch (e) {
			console.error('Failed to generate query embedding:', e);
			// Fall back to text search
			return await textSearchFallback(query_text, limit);
		}

		// Vector similarity search using SurrealDB's MTREE
		const [results] = await db.query<[any[]]>(
			`SELECT 
				*,
				vector::similarity::cosine(vector, $query_vector) as score
			FROM embeddings
			WHERE vector::similarity::cosine(vector, $query_vector) > $threshold
			ORDER BY score DESC
			LIMIT $limit`,
			{
				query_vector: queryVector,
				threshold,
				limit
			}
		);

		if (!results || results.length === 0) {
			// Try alias matching
			return await aliasSearchFallback(query_text, limit);
		}

		// Fetch the actual reports
		const reportIds = results.map((r) => r.source_id);
		const reports = await Promise.all(
			reportIds.map(async (id) => {
				const [report] = await db.query<[any]>(
					`SELECT *, 
						->report_locations->(levels, electric_rooms, boards, breakers, area_name) as locations
					FROM $id`,
					{ id: new RecordId(id.split(':')[0], id.split(':')[1]) }
				);
				return report;
			})
		);

		// Combine with scores
		return reports
			.filter(Boolean)
			.map((report, idx) => ({
				record: report,
				score: results[idx]?.score || 0,
				matchType: 'vector' as const,
				locationPath: buildLocationPath(report.locations)
			}))
			.sort((a, b) => b.score - a.score);
	}
);

/**
 * Fallback text search when embeddings fail
 */
async function textSearchFallback(query_text: string, limit: number): Promise<SearchResult[]> {
	const db = await getDb();

	const [results] = await db.query<[any[]]>(
		`SELECT *, 
			->report_locations->(levels, electric_rooms, boards, breakers, area_name) as locations
		FROM reports
		WHERE description CONTAINS $query
		ORDER BY created_at DESC
		LIMIT $limit`,
		{ query: query_text, limit }
	);

	return (results || []).map((report) => ({
		record: report,
		score: 0.5, // Default score for text match
		matchType: 'text' as const,
		locationPath: buildLocationPath(report.locations)
	}));
}

/**
 * Alias-based search for typo tolerance
 */
async function aliasSearchFallback(query_text: string, limit: number): Promise<SearchResult[]> {
	const db = await getDb();

	// Check aliases table
	const [aliases] = await db.query<[any[]]>(
		`SELECT * FROM aliases 
		WHERE alias CONTAINS $query OR canonical CONTAINS $query`,
		{ query: query_text }
	);

	if (!aliases || aliases.length === 0) {
		return [];
	}

	// Search by canonical names
	const canonicalNames = aliases.map((a) => a.canonical);
	const results: SearchResult[] = [];

	for (const name of canonicalNames) {
		const [reports] = await db.query<[any[]]>(
			`SELECT *, 
				->report_locations->(levels, electric_rooms, boards, breakers, area_name) as locations
			FROM reports
			WHERE description CONTAINS $name
			LIMIT $limit`,
			{ name, limit: Math.ceil(limit / canonicalNames.length) }
		);

		if (reports) {
			results.push(
				...reports.map((report) => ({
					record: report,
					score: 0.3, // Lower score for alias match
					matchType: 'alias' as const,
					locationPath: buildLocationPath(report.locations)
				}))
			);
		}
	}

	return results.slice(0, limit);
}

/**
 * Build a human-readable location path
 */
function buildLocationPath(locations: any[]): string | undefined {
	if (!locations || locations.length === 0) return undefined;

	return locations
		.map((loc) => {
			if (loc.name) return loc.name;
			if (loc.id) return loc.id.toString();
			return 'Unknown';
		})
		.join(' > ');
}

// ── Embedding Management ────────────────────────────────────────────

/**
 * Generate embeddings for existing reports that don't have them
 */
export const backfillEmbeddings = query(
	z.object({
		limit: z.number().optional().default(50)
	}),
	async ({ limit }) => {
		const db = await getDb();

		// Find reports without embeddings
		const [reports] = await db.query<[any[]]>(
			`SELECT * FROM reports 
			WHERE id NOT IN (SELECT source_id FROM embeddings WHERE source_table = 'reports')
			LIMIT $limit`,
			{ limit }
		);

		if (!reports || reports.length === 0) {
			return { processed: 0, message: 'No reports to backfill' };
		}

		let processed = 0;
		let failed = 0;

		for (const report of reports) {
			try {
				const vector = await embeddingClient.embedText(report.description);
				await db.query(
					`CREATE embeddings SET
						source_table = 'reports',
						source_id = $source_id,
						vector = $vector,
						text_content = $text,
						created_at = time::now()`,
					{
						source_id: report.id.toString(),
						vector,
						text: report.description
					}
				);
				processed++;
			} catch (e) {
				console.warn(`Failed to embed report ${report.id}:`, e);
				failed++;
			}
		}

		return { processed, failed, total: reports.length };
	}
);

/**
 * Check embedding service health
 */
export const checkEmbeddingHealth = query(async () => {
	try {
		const isHealthy = await embeddingClient.healthCheck();
		return { healthy: isHealthy, url: env.EMBEDDING_URL };
	} catch (e: any) {
		return { healthy: false, error: e.message, url: env.EMBEDDING_URL };
	}
});
