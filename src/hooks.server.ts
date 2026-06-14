import type { Handle } from "@sveltejs/kit";

const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
};

export const handleError = (e: ErrorEvent) => {
	console.error(colors.red, "[ERROR]", colors.reset, e.error.message);
	return e
};


export const handle: Handle = async ({ event, resolve }) => {
	console.log(colors.blue, "[REQ]",colors.green, event.route.id, event.params.page?event.params.page:"", colors.reset, event.url?.searchParams.toString());
	try {
		if (!event.locals.db) {
			event.locals.db = {
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
		console.log(colors.red, "[COOKIE ERROR]", colors.reset, e.message);
		return resolve(event);
	}
}
