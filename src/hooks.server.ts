import { getRequestEvent } from "$app/server";
import { env } from "$env/dynamic/private";
import { connect, connect_system } from "$lib/db.remote";
import { getDiagnostics } from "$lib/nodered.remote";
import { root_access } from "$lib/server/root_db.svelte";
import { error, type Handle, type HandleValidationError, type ServerInit } from "@sveltejs/kit";

const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
};

export const init: ServerInit = async ()=>{
	const isConnected = await root_access.connect(env.SURREAL_URL, {
		authentication: {
			username: env.SURREAL_VIEWER_USER,
			password: env.SURREAL_VIEWER_PASS,
		}
	}).catch(() => false);
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

export const handle: Handle = ({ event, resolve }) => {
	const type = event.isRemoteRequest ? "[REMOTE]" : "[REQ]";
	console.log(colors.blue, type,colors.green, event.route.id, event.params.page?event.params.page:"", colors.reset, event.url?.searchParams.toString());
	try {
		if (!event.locals.db) {
			event.locals.db = {
				isConnected: false,
				token: null,
				username: "user"
			}
		}
		const token = event.cookies.get("sr_token");
		const username = event.cookies.get("sr_user");

		if (token == undefined) {
			return resolve(event);
		}
		event.locals.db.token = token
		event.locals.db.username = username ?? "user"
		return resolve(event);
	} catch (e) {
		console.error(colors.red, "[COOKIE ERROR]", colors.reset, e.message);
		return resolve(event);
	}
}
