import type { Handle } from "@sveltejs/kit";
import type { Token } from "surrealdb";
import { toast } from "svelte-sonner";
import z from "zod/v4";

export const handleError = (e: ErrorEvent) => {
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
