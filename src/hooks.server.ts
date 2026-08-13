import { env } from '$env/dynamic/private';
import { decodeJWT, getTokenMaxAge } from '$lib/utils';
import {
	error,
	type Handle,
	type HandleFetch,
	type HandleValidationError,
	type ServerInit
} from '@sveltejs/kit';
import { sequence } from '@sveltejs/kit/hooks';
import { NotAllowedError, Surreal, SurrealError } from 'surrealdb';

const colors = {
	red: '\x1b[31m',
	green: '\x1b[32m',
	yellow: '\x1b[33m',
	blue: '\x1b[34m',
	reset: '\x1b[0m'
};

export const init: ServerInit = () => {
	// root_access.connect(env.SURREAL_URL, {
	// 	authentication: {
	// 		username: env.SURREAL_ROOT_VIEWER_USER,
	// 		password: env.SURREAL_ROOT_VIEWER_PASS,
	// 	}
	// }).catch((e) =>{ return false  });
	// db.connect(env.SURREAL_URL).catch((e)=>{ return false });
};

export const handleError = (e: ErrorEvent) => {
	let public_message = 'Error';
	if (e.error instanceof SurrealError) {
		public_message = 'Database Error';
	}
	console.error(colors.red, `[${public_message}]`, colors.reset, e.error.message);
	return { message: public_message };
};

export const handleValidationError: HandleValidationError = async ({ event, issues }) => {
	console.log(colors.red, '[VALIDATION ERROR]', colors.reset, issues);
	const message = issues.map((issue) => issue.message).join(', ');
	error(400, {
		message
	});
};

const defaut_user = {
	username: env.SURREAL_DEFAULT_USERNAME,
	password: env.SURREAL_DEFAULT_PASSWORD,
	namespace: env.SURREAL_DEFAULT_NAMESPACE
};
const log_request: Handle = async ({ event, resolve }) => {
	const type = event.isRemoteRequest ? '[REMOTE]' : '[REQ]';
	let remoteFuncName = '';
	if (event.request.url.includes('remote')) remoteFuncName = event.request.url.split('/').pop()!;
	const method = event.isRemoteRequest ? remoteFuncName : event.request.method;
	console.log(
		colors.blue,
		type,
		colors.yellow,
		method,
		colors.green,
		event.route.id,
		event.params.page ? event.params.page : '',
		colors.reset,
		event.url?.searchParams.toString()
	);
	return await resolve(event);
};

const get_cookies: Handle = async ({ event, resolve }) => {
	const token = event.cookies.get('sr_token') ?? null;
	const database = event.cookies.get('sr_db') ?? 'main';
	event.locals.db = {
		...event.locals.db,
		token,
		database
	};
	return await resolve(event);
};

const db_init: Handle = async ({ event, resolve }) => {
	try {
		event.locals.db.instance = new Surreal();
		await event.locals.db.instance.connect(env.SURREAL_URL).catch(() => false);

		event.locals.db.root_instance = new Surreal();
		await event.locals.db.root_instance
			.connect(env.SURREAL_URL, {
				authentication: {
					username: env.SURREAL_ROOT_VIEWER_USER,
					password: env.SURREAL_ROOT_VIEWER_PASS
				}
			})
			.catch(() => false);

		return await resolve(event);
	} catch (e) {
		console.error(colors.red, '[DB INIT]', colors.reset, e.message);
		return await resolve(event);
	}
};

const check_auth: Handle = async ({ event, resolve }) => {
	try {
		if (!event.locals.db.instance.isConnected || !event.locals.db.instance.isConnected) {
			return db_init({ event, resolve });
			// return resolve(event);
		}
		if (event.locals.db.token == null) {
			console.warn('Token not found login as default user');
			const tokens = await event.locals.db.instance.signin(defaut_user).catch((e) => {
				return error(503, 'Cant signin as default user');
			});
			const decoded = decodeJWT(tokens.access);
			const maxAge = getTokenMaxAge(decoded);
			event.cookies.set('sr_token', tokens.access, {
				path: '/',
				maxAge
			});
			event.locals.db = {
				...event.locals.db,
				token: tokens.access,
				username: decoded.ID ?? defaut_user.username,
				// namespace: decoded.NS ?? defaut_user.namespace,
				database: decoded.DB ?? event.locals.db.database
			};
			return await resolve(event);
		} else {
			if (!event.route.id || event.url.pathname.startsWith('/api/v1/db/signin')) {
				return await resolve(event);
			}
			const tokens = await event.locals.db.instance
				.authenticate(event.locals.db.token)
				.catch(async (e) => {
					if (e instanceof NotAllowedError) {
						if (e.isTokenExpired) {
							console.warn('Token expired deleting it and redirecting to login');
							event.cookies.delete('sr_token', { path: '/' });
							event.locals.db.token = null;
							return await event.locals.db.instance.signin(defaut_user).catch((e) => {
								return error(503, 'Cant signin as default user');
							});
						}
					}
					return error(400, e);
				});
			const decoded = decodeJWT(tokens.access);
			const maxAge = getTokenMaxAge(decoded);
			event.cookies.set('sr_token', tokens.access, {
				path: '/',
				maxAge
			});
			event.locals.db = {
				...event.locals?.db,
				token: tokens.access,
				username: decoded.ID,
				// namespace: decoded.NS ?? defaut_user.namespace,
				database: event.locals.db.database ?? decoded.DB
			};
		}
		return await resolve(event);
	} catch (e) {
		console.error(colors.red, '[AUTH HOOK ERR]', colors.reset, e);
		return await resolve(event);
	}
};

export const handle: Handle = sequence(log_request, get_cookies, db_init, check_auth);

export const handleFetch: HandleFetch = async ({ event, request, fetch }) => {
	console.log('FETCH', event.request.method, event.url.pathname);
	return fetch(request);
};
