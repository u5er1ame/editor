import { type RequestHandler } from '@sveltejs/kit';
import { decodeJWT, getTokenMaxAge } from '$lib/utils';
import { getSystemInfo } from '$lib/db.remote';
import z from 'zod/v4';

const SigninSchema = z.object({
	username: z.string().min(1),
	password: z.string().min(1),
	namespace: z.string().optional()
});

export const POST: RequestHandler = async ({ request, cookies, locals }) => {
	const rawData = await request.json();
	const parsed = SigninSchema.safeParse(rawData);

	if (!parsed.success) {
		return new Response(JSON.stringify({ message: parsed.error.message }), { status: 400 });
	}

	const data = parsed.data;

	if (!data.namespace) {
		const info = await getSystemInfo();
		data.namespace = info?.defaults.namespace;
	}

	let body = { message: 'OK' };
	let code = 200;

	await locals.db.instance
		.signin(data)
		.then((tokens) => {
			const decoded = decodeJWT(tokens.access);
			const maxAge = getTokenMaxAge(decoded);
			cookies.set('sr_token', tokens.access, {
				httpOnly: true,
				path: '/',
				maxAge
			});
			locals.db = {
				...locals.db,
				token: tokens.access,
				username: decoded.ID,
				database: decoded.DB
			};
		})
		.catch((e) => {
			body.message = e.message;
			code = 400;
		});

	return new Response(JSON.stringify(body), { status: code });
};
