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

// ── GET: List Reports ───────────────────────────────────────────────

export const GET: RequestHandler = async ({ url, locals }) => {
	const db = locals.db.instance;
	if (!db.isConnected) {
		return error(500, 'Database not connected');
	}

	await db.ready;

	const limit = parseInt(url.searchParams.get('limit') || '50');
	const status = url.searchParams.get('status');

	let query = `SELECT *, 
		->report_locations->(levels, electric_rooms, boards, breakers, area_name) as locations
	FROM reports`;

	if (status) {
		query += ` WHERE status = '${status}'`;
	}

	query += ` ORDER BY created_at DESC LIMIT ${limit}`;

	const [reports] = await db.query<any[]>(query);

	return json({
		reports: reports || [],
		total: reports?.length || 0
	});
};

// ── POST: Create Report ─────────────────────────────────────────────

export const POST: RequestHandler = async ({ request, locals }) => {
	const { description, location_ids } = await request.json();

	if (!description || description.trim().length === 0) {
		return error(400, 'Description is required');
	}

	const db = locals.db.instance;
	if (!db.isConnected) {
		return error(500, 'Database not connected');
	}

	await db.ready;

	// Create the report
	const [report] = await db.query<any[]>(
		`CREATE reports SET
			description = $description,
			status = 'open',
			created_at = time::now(),
			created_by = $username`,
		{
			description: description.trim(),
			username: locals.db.username || 'unknown'
		}
	);

	if (!report) {
		return error(500, 'Failed to create report');
	}

	// Link to locations if provided
	if (location_ids && location_ids.length > 0) {
		for (const loc_id of location_ids) {
			try {
				const [table, id] = loc_id.split(':');
				await db.query(
					`RELATE $report->report_locations->$location SET confidence = 1.0`,
					{
						report: report.id,
						location: new RecordId(table, id)
					}
				);
			} catch (e) {
				console.warn(`Failed to link location ${loc_id}:`, e);
			}
		}
	}

	// Generate embedding (async, don't block response)
	generateEmbedding(description)
		.then(async (vector) => {
			try {
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
						text: description.trim()
					}
				);
			} catch (e) {
				console.warn('Failed to create embedding:', e);
			}
		})
		.catch((e) => {
			console.warn('Failed to generate embedding:', e);
		});

	return json(report, { status: 201 });
};
