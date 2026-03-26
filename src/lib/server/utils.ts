import { getRequestEvent } from "$app/server";
import { redirect } from "@sveltejs/kit";

export function getDbLocals() {
	const { locals, url, cookies } = getRequestEvent();
	// INFO: moved to root layout handler
	// so it will be available in all pages (not sure about token share)

	// if (!locals.db) {
		// const token = cookies.get("sr_token");
		// const url = cookies.get("sr_endpoint");
		// if (token && url) {
		// 	locals.db = {
		// 		// FIXME: THIS COULD FAIL DRASTICALLY
		// 		token: JSON.parse(token),
		// 		url: JSON.parse(url),
		// 	}
		// }
	// }
	return locals.db;
}
