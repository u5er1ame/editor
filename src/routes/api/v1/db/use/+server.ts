import { error, json, type RequestHandler } from '@sveltejs/kit';
import type { NamespaceDatabase } from 'surrealdb';
import z from 'zod/v4';

const UseSchema = z.object({
	namespace: z.string().optional(),
	database: z.string().optional()
});

export const POST: RequestHandler = async ({ request, locals, cookies }) => {
	const rawData = await request.json();
	const parsed = UseSchema.safeParse(rawData);

	if (!parsed.success) {
		return error(400, parsed.error.message);
	}

	const data: NamespaceDatabase = parsed.data;
	const use = await locals.db.instance.use(data).catch(() => {});
	if (!use) return error(403, 'Cant switch namespace/database');
	locals.db.database = use.database ?? 'main';
	cookies.set('sr_db', use.database ?? 'main', {
		path: '/',
		httpOnly: true
	});
	return json(use);
};
