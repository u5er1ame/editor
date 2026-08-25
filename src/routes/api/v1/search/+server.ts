import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { env } from '$env/dynamic/private';
import { Surreal, RecordId } from 'surrealdb';

// ── Embedding Helper ────────────────────────────────────────────────

async function generateEmbedding(text: string): Promise<number[]> {
	const embeddingUrl = env.EMBEDDING_URL || 'http://localhost:1234/v1/embeddings';

	const response = await fetch(embeddingUrl, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({
			model: 'jina-embeddings-v5-omni',
			input: text
		})
	});

	if (!response.ok) {
		throw new Error(`Embedding failed: ${response.status}`);
	}

	const data = await response.json();
	return data.data[0].embedding;
}

// ── Search Endpoint ─────────────────────────────────────────────────

export const POST: RequestHandler = async ({ request, locals }) => {
	const { query_text, limit = 10, threshold = 0.3 } = await request.json();

	if (!query_text || query_text.trim().length === 0) {
		return error(400, 'Query text is required');
	}

	const db = locals.db.instance;
	if (!db.isConnected) {
		return error(500, 'Database not connected');
	}

	await db.ready;

	let results: any[] = [];

	// Try vector search first
	try {
		const queryVector = await generateEmbedding(query_text);

		const [vectorResults] = await db.query<any[]>(
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

		if (vectorResults && vectorResults.length > 0) {
			// Fetch the actual reports
			for (const embedding of vectorResults) {
				const sourceId = embedding.source_id;
				const [table, id] = sourceId.split(':');

				try {
					const [report] = await db.query<any[]>(
						`SELECT * FROM $id`,
						{ id: new RecordId(table, id) }
					);

					if (report) {
						// Get location path
						const [locations] = await db.query<any[]>(
							`SELECT ->report_locations->(levels, electric_rooms, boards, breakers, area_name) as loc FROM $id`,
							{ id: report.id }
						);

						results.push({
							record: report,
							score: embedding.score,
							matchType: 'vector',
							locationPath: buildLocationPath(locations?.[0]?.loc)
						});
					}
				} catch (e) {
					console.warn(`Failed to fetch report ${sourceId}:`, e);
				}
			}
		}
	} catch (e) {
		console.warn('Vector search failed, falling back to text search:', e);
	}

	// Fallback to text search if no vector results
	if (results.length === 0) {
		try {
			const [textResults] = await db.query<any[]>(
				`SELECT * FROM reports 
				WHERE description CONTAINS $query
				ORDER BY created_at DESC
				LIMIT $limit`,
				{ query: query_text, limit }
			);

			if (textResults) {
				for (const report of textResults) {
					const [locations] = await db.query<any[]>(
						`SELECT ->report_locations->(levels, electric_rooms, boards, breakers, area_name) as loc FROM $id`,
						{ id: report.id }
					);

					results.push({
						record: report,
						score: 0.5,
						matchType: 'text',
						locationPath: buildLocationPath(locations?.[0]?.loc)
					});
				}
			}
		} catch (e) {
			console.warn('Text search failed:', e);
		}
	}

	// Try alias matching if still no results
	if (results.length === 0) {
		try {
			const [aliases] = await db.query<any[]>(
				`SELECT * FROM aliases 
				WHERE alias CONTAINS $query OR canonical CONTAINS $query`,
				{ query: query_text }
			);

			if (aliases && aliases.length > 0) {
				const canonicalNames = [...new Set(aliases.map((a: any) => a.canonical))];

				for (const name of canonicalNames) {
					const [reports] = await db.query<any[]>(
						`SELECT * FROM reports 
						WHERE description CONTAINS $name
						LIMIT $limit`,
						{ name, limit: Math.ceil(limit / canonicalNames.length) }
					);

					if (reports) {
						for (const report of reports) {
							const [locations] = await db.query<any[]>(
								`SELECT ->report_locations->(levels, electric_rooms, boards, breakers, area_name) as loc FROM $id`,
								{ id: report.id }
							);

							results.push({
								record: report,
								score: 0.3,
								matchType: 'alias',
								locationPath: buildLocationPath(locations?.[0]?.loc)
							});
						}
					}
				}
			}
		} catch (e) {
			console.warn('Alias search failed:', e);
		}
	}

	// Sort by score and limit
	results.sort((a, b) => b.score - a.score);
	results = results.slice(0, limit);

	return json({
		query: query_text,
		results,
		total: results.length
	});
};

// ── Helper ──────────────────────────────────────────────────────────

function buildLocationPath(locations: any[] | undefined): string | undefined {
	if (!locations || locations.length === 0) return undefined;

	return locations
		.filter(Boolean)
		.map((loc: any) => {
			if (loc.name) return loc.name;
			if (loc.id) return loc.id.toString().split(':').pop();
			return 'Unknown';
		})
		.join(' > ');
}
