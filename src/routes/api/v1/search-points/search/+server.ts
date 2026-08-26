import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { searchSearchPoints, type SearchPointImage } from '$lib/server/search-points';
import { SearchPointSearchSchema } from '$lib/model/search-points';

export const POST: RequestHandler = async ({ request, locals }) => {
	const db = locals.db.instance;
	if (!db.isConnected) return error(500, 'Database not connected');

	await db.ready;
	const form = await request.formData();
	const rawLimit = form.get('limit');
	const rawThreshold = form.get('threshold');
	const parsed = SearchPointSearchSchema.safeParse({
		query_text: typeof form.get('query_text') === 'string' ? form.get('query_text') : undefined,
		limit: typeof rawLimit === 'string' ? Number(rawLimit) : undefined,
		threshold: typeof rawThreshold === 'string' ? Number(rawThreshold) : undefined
	});
	if (!parsed.success) return error(400, parsed.error.message);

	const rawImage = form.get('image');
	let image: SearchPointImage | undefined;
	if (rawImage instanceof File && rawImage.size > 0) {
		image = {
			data: await rawImage.arrayBuffer(),
			contentType: rawImage.type,
			name: rawImage.name
		};
	}

	try {
		const results = await searchSearchPoints(db, parsed.data, image);
		return json({ results, total: results.length });
	} catch (cause) {
		console.error('Search point query failed:', cause);
		return error(500, cause instanceof Error ? cause.message : 'Search failed');
	}
};
