import { json } from "@sveltejs/kit";
import type { PageServerLoad } from "../$types";

export const load: PageServerLoad = async ({ fetch }) => {
	try {
		// console.log("pre fetching tables");
		// const res = await fetch("/api/v1/db/tables");
		// const data: { tables: any[][] } = await res.json();
		// return { tables: data.tables[0] ?? [] }
		return { tables: [] };
	} catch (e) {
		console.log(e);
		return { error: e.body.message, tables: [] };
	}

};
