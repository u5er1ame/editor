import { env } from "$env/dynamic/private";
import { db, root_access } from "$lib/server/root_db.svelte";
import { decodeJWT } from "$lib/utils";
import { error, json, redirect, type Handle, type HandleFetch, type HandleValidationError, type ServerInit } from "@sveltejs/kit";
import { sequence } from "@sveltejs/kit/hooks";
import { jsonify, NotAllowedError } from "surrealdb";

const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
};


export const init: ServerInit = ()=>{
	root_access.connect(env.SURREAL_URL, {
		authentication: {
			username: env.SURREAL_ROOT_VIEWER_USER,
			password: env.SURREAL_ROOT_VIEWER_PASS,
		}
	}).catch((e) =>{ return false  });
	db.connect(env.SURREAL_URL).catch((e)=>{ return false });
}

export const handleError = (e: ErrorEvent) => {
	console.error(colors.red, "[ERROR]", colors.reset, e.error.message);
	return "Server Error"
};

export const handleValidationError: HandleValidationError = async ({ event, issues }) => {
	console.log(colors.red, "[VALIDATION ERROR]", colors.reset, issues);
	const message = issues.map((issue) => issue.message).join(", ");
	error(404, {
		message,
	})
};

const defaut_user = {
	username: env.SURREAL_DEFAULT_USERNAME,
	password: env.SURREAL_DEFAULT_PASSWORD,
	namespace: env.SURREAL_DEFAULT_NAMESPACE,
}
const log_request: Handle = async ({ event, resolve }) => {
	const type = event.isRemoteRequest ? "[REMOTE]" : "[REQ]";
	let remoteFuncName = ""
	if(event.request.url.includes("remote")) remoteFuncName = event.request.url.split("/").pop()!
	const method = event.isRemoteRequest? remoteFuncName : event.request.method;
	console.log(colors.blue, type, colors.yellow, method, colors.green, event.route.id, event.params.page?event.params.page:"", colors.reset, event.url?.searchParams.toString());
	return await resolve(event);
};

const get_cookies: Handle = async ({ event, resolve }) => {
	const token = event.cookies.get("sr_token") ?? null;
	const database = event.cookies.get("sr_db") ?? "main";
	event.locals.db = {
		isConnected: db.isConnected,
		token: token,
		database,
	};
	return await resolve(event);
};

const reccon: Handle = async ({ event, resolve }) => {
	try {
		// if (root_access.isConnected == false) {
			await root_access.connect(env.SURREAL_URL, {
				authentication: {
					username: env.SURREAL_ROOT_VIEWER_USER,
					password: env.SURREAL_ROOT_VIEWER_PASS,
				}
			}).catch((e)=>{ return error(500, e) });
		// }
		// if (db.isConnected == false) {
			const isConnected = await db.connect(env.SURREAL_URL,{ authentication: event.locals.db.token  }).catch((e)=>{ return error(500, e) });
			event.locals.db.isConnected = isConnected;
		// }
		return await resolve(event);
	} catch (e) {
		console.error(colors.red, "[CHECK CONNECTION]", colors.reset, e.message);
		event.locals.db.isConnected = false;
		return await resolve(event);
	}
};

const check_auth: Handle = async ({ event, resolve }) => {
	try {
		if (event.locals.db.isConnected == false) {
			return error(400, "Cant check auth because connection is not established");
		}
		if (event.locals.db.token == null) {
			console.warn("Token not found login as default user");
			const tokens = await db.signin(defaut_user).catch((e)=>{ return error(503, "Cant signin as default user") });
			event.cookies.set("sr_token", tokens.access, {
				path: "/",
			});
			const decoded = decodeJWT(tokens.access);
			event.locals.db = {
				...event.locals.db,
				token: tokens.access,
				username: decoded.ID ?? defaut_user.username,
				namespace: decoded.NS ?? defaut_user.namespace,
				database: decoded.DB ?? event.locals.db.database,
			};
			return await resolve(event);
		}
		else {
			const tokens = await db.authenticate(event.locals.db.token).catch((e)=>{
				if (e instanceof NotAllowedError ) {
					if (e.isTokenExpired) {
						console.warn("Token expired deleting it and redirecting to login");
						event.cookies.delete("sr_token", { path: "/" });
						event.locals.db.isConnected = true;
						event.locals.db.token = null
						return redirect(303, "/api/v1/db/signin");
					}
				}
				return error(400, e);
			});
			event.cookies.set("sr_token", tokens.access, {
				path: "/",
			});
			const decoded = decodeJWT(tokens.access);
			event.locals.db = {
				...event.locals?.db,
				token: tokens.access,
				username: decoded.ID,
				namespace: decoded.NS ?? defaut_user.namespace,
				database: event.locals.db.database ?? decoded.DB,
			};
		}
		return await resolve(event);
	} catch (e) {
		console.error(colors.red, "[HOOk ERROR]", colors.reset, e);
		return await resolve(event);
	}
}

export const handle: Handle = sequence(log_request, get_cookies, reccon, check_auth);

export const handleFetch: HandleFetch = async ({ event, request, fetch }) => {
	console.log("FETCH", event.request.method, event.url.pathname);
	return fetch(request);
}
