import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createSearchPoint, type SearchPointImage, toSearchPointDto } from '$lib/server/search-points';
import { SearchPointCreateSchema } from '$lib/model/search-points';

export const GET: RequestHandler = async ({ locals }) => {
	const db = locals.db.instance;
	if (!db.isConnected) return error(500, 'Database not connected');

	await db.ready;
	const [records] = await db.query<any[]>(
		`SELECT id, description, photo, x, y, zone_id
		 FROM embeddings
		 WHERE x != NONE AND y != NONE
		 ORDER BY created_at DESC`
	);

	return json((records ?? []).map(toSearchPointDto));
};

export const POST: RequestHandler = async ({ request, locals }) => {
	const roles = await getCurrentRoles(locals.db);
	if (!roles.includes('EDITOR') && !roles.includes('OWNER')) {
		return error(403, 'Only editors and owners can create searchable points');
	}

	const db = locals.db.instance;
	if (!db.isConnected) return error(500, 'Database not connected');

	await db.ready;

	const form = await request.formData();
	const x = form.get('x');
	const y = form.get('y');
	const parsed = SearchPointCreateSchema.safeParse({
		description: form.get('description'),
		x: typeof x === 'string' ? Number(x) : NaN,
		y: typeof y === 'string' ? Number(y) : NaN,
		zone_id: typeof form.get('zone_id') === 'string' ? form.get('zone_id') : undefined
	});

	if (!parsed.success) return error(400, parsed.error.message);

	const rawPhoto = form.get('photo');
	let photo: SearchPointImage | undefined;
	if (rawPhoto instanceof File && rawPhoto.size > 0) {
		photo = {
			data: await rawPhoto.arrayBuffer(),
			contentType: rawPhoto.type,
			name: rawPhoto.name
		};
	}

	try {
		const point = await createSearchPoint(
			db,
			parsed.data,
			photo,
			await resolveContext(db, parsed.data.zone_id),
			locals.db.username
		);
		return json({ point }, { status: 201 });
	} catch (cause) {
		console.error('Search point creation failed:', cause);
		return error(500, cause instanceof Error ? cause.message : 'Failed to create searchable point');
	}
};

async function getCurrentRoles(locals: App.Locals['db']) {
	if (!locals.username) return [];
	try {
		const [info] = await locals.instance.query<any[]>('info for ns structure');
		return info?.users?.find((user: any) => user.name === locals.username)?.roles ?? [];
	} catch {
		return [];
	}
}

async function resolveContext(db: App.Locals['db']['instance'], zoneId?: string) {
	if (!zoneId) return {};
	try {
		const [zone] = await db.query<any[]>(
			`SELECT name, level_id.name AS level_name FROM $id FETCH level_id`,
			{ id: zoneId }
		);
		return { zone: zone?.name, level: zone?.level_name };
	} catch {
		return {};
	}
}
