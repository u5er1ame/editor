import type { Handle } from "@sveltejs/kit";
import { toast } from "svelte-sonner";

export const handleError = (e: ErrorEvent) => {
	console.log(e,e.message);
	toast.error(e.message);
	return e
};


export const handle: Handle = async ({ event, resolve }) => {
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
		console.log("ERR:", e);
		return resolve(event);
	}
}
