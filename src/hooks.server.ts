import { env } from "$env/dynamic/private";
import { db, root_access } from "$lib/server/root_db.svelte";
import { decodeJWT } from "$lib/utils";
import { error, json, redirect, type Handle, type HandleValidationError, type ServerInit } from "@sveltejs/kit";
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
	}).catch((e) =>{ error(500, e) });
	db.connect(env.SURREAL_URL).catch((e)=>{ error(500, e) });
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

export const handle: Handle = async ({ event, resolve }) => {
	try {
		const token = event.cookies.get("sr_token") ?? null;
		event.locals.db = {
			isConnected: false,
			isAuth: false,
			token: token,
		};
		const type = event.isRemoteRequest ? "[REMOTE]" : "[REQ]";
		console.log(colors.blue, type,colors.green, event.route.id, event.params.page?event.params.page:"", colors.reset, event.url?.searchParams.toString());

		if (root_access.isConnected == false) {
			await root_access.connect(env.SURREAL_URL, {
				authentication: {
					username: env.SURREAL_ROOT_VIEWER_USER,
					password: env.SURREAL_ROOT_VIEWER_PASS,
				}
			});
		}
		if (db.isConnected == false) {
			const isConnected = await db.connect(env.SURREAL_URL);
			if (!isConnected) return resolve(event);
		}
		else {
			event.locals.db.isConnected = true;
			if (event.locals.db.token == null) {
				console.warn("Token not found login as default user");
				const tokens = await db.signin(defaut_user).catch((e)=>{ event.locals.db.isAuth = false; return error(503, "Cant signin as default user") });
				event.cookies.set("sr_token", tokens.access, {
					httpOnly: true,
					path: "/",
				});
				const decoded = decodeJWT(tokens.access);
				event.locals.db = {
					...event.locals.db,
					isAuth: true,
					token: tokens.access,
					username: decoded.ID ?? defaut_user.username,
					namespace: decoded.NS ?? defaut_user.namespace,
					database: decoded.DB,
				};
				return resolve(event);
			}
			else {
				const tokens = await db.authenticate(event.locals.db.token).catch((e)=>{
					if (e instanceof NotAllowedError ) {
						if (e.isTokenExpired) {
							console.warn("Token expired deleting it and redirecting to login");
							event.cookies.delete("sr_token", { path: "/" });
							event.locals.db = {
								isConnected: true,
								token: null,
								isAuth: false,
							}
							return redirect(303, "/api/v1/db/signin");
						}
					}
					return error(400, e);
				});
				event.cookies.set("sr_token", tokens.access, {
					httpOnly: true,
					path: "/",
				});
				const decoded = decodeJWT(tokens.access);
				event.locals.db = {
					...event.locals?.db,
					isAuth: true,
					token: tokens.access,
					username: decoded.ID,
					namespace: decoded.NS ?? defaut_user.namespace,
					database: decoded.DB
				};
			}
		}
		return resolve(event);
	} catch (e) {
		console.error(colors.red, "[HOOk ERROR]", colors.reset, e);
		return resolve(event);
	}
}
