import { db } from "$lib/db"
import type { PageData } from "./$types";

export const load: PageData = async () => {
	console.log('both');
	return {
		db: db.status
	};
};
