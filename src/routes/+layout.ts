import { db } from "$lib/db"
import type { PageData } from "./$types";

export const load: PageData = async () => {
	return {
		db: db.status
	};
};
