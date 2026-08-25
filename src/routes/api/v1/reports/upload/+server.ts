import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { env } from '$env/dynamic/private';
import { Surreal, RecordId } from 'surrealdb';

// ── POST: Upload Image for Report ───────────────────────────────────

export const POST: RequestHandler = async ({ request, locals }) => {
	const formData = await request.formData();
	const file = formData.get('file') as File | null;
	const reportId = formData.get('report_id') as string | null;

	if (!file) {
		return error(400, 'No file provided');
	}

	if (!reportId) {
		return error(400, 'Report ID is required');
	}

	const db = locals.db.instance;
	if (!db.isConnected) {
		return error(500, 'Database not connected');
	}

	await db.ready;

	try {
		// Convert file to ArrayBuffer
		const arrayBuffer = await file.arrayBuffer();
		const uint8Array = new Uint8Array(arrayBuffer);

		// Generate a unique key
		const timestamp = Date.now();
		const random = Math.random().toString(36).substring(2, 8);
		const ext = file.name.split('.').pop() || 'jpg';
		const bucketKey = `reports/${reportId}/${timestamp}_${random}.${ext}`;

		// Store in SurrealDB bucket
		// Note: This is a simplified approach. In production, you'd use the bucket API
		// For now, we'll store the file reference in the report
		const [table, id] = reportId.split(':');
		const recordId = new RecordId(table, id);

		// Update report with image reference
		await db.query(
			`UPDATE $id SET
				bucket_key = $bucket_key,
				content_type = $content_type`,
			{
				id: recordId,
				bucket_key: bucketKey,
				content_type: file.type
			}
		);

		// Generate embedding from image (multimodal)
		try {
			const embeddingUrl = env.EMBEDDING_URL || 'http://localhost:1234/v1/embeddings';

			// Convert to base64 for the embedding API
			const base64 = Buffer.from(uint8Array).toString('base64');
			const dataUrl = `data:${file.type};base64,${base64}`;

			// Get the report description for multimodal embedding
			const [report] = await db.query<any[]>(
				`SELECT description FROM $id`,
				{ id: recordId }
			);

			if (report?.description) {
				// Generate multimodal embedding (text + image)
				const response = await fetch(embeddingUrl, {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						model: 'jina-embeddings-v5-omni',
						input: report.description,
						image: dataUrl
					})
				});

				if (response.ok) {
					const embeddingData = await response.json();
					const vector = embeddingData.data[0].embedding;

					// Update the embedding with multimodal vector
					await db.query(
						`UPDATE embeddings SET vector = $vector
						WHERE source_table = 'reports' AND source_id = $source_id`,
						{
							source_id: reportId,
							vector
						}
					);
				}
			}
		} catch (e) {
			console.warn('Failed to generate multimodal embedding:', e);
		}

		return json({
			success: true,
			bucket_key: bucketKey,
			content_type: file.type,
			size: file.size
		});
	} catch (e: any) {
		console.error('Upload failed:', e);
		return error(500, `Upload failed: ${e.message}`);
	}
};
