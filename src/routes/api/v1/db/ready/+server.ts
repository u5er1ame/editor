import { error, json, type RequestHandler } from "@sveltejs/kit";

export const GET: RequestHandler = async ({ locals }) => {
	try {
		await locals.db.instance.ready;
		return json({ ready: true });
	} catch {
		return error(503, { message: 'DB not ready' });
	}
}
