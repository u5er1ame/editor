import type { Handle } from "@sveltejs/kit";
import type { Tokens } from "surrealdb";
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
				url: ""
			}
		}
		const token = event.cookies.get("sr_token");
		const url = event.cookies.get("sr_endpoint");

		if (url != undefined) {
			event.locals.db.url = JSON.parse(url);
		}
		if (token == undefined) {
			return resolve(event);
		}
		event.locals.db.token = JSON.parse(token);
		return resolve(event);
	} catch (e) {
		console.log("ERR", e);
		return resolve(event);
	}
}
