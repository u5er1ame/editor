import type { PageServerData } from "./$types";
import { getDbLocals } from "$lib/server/utils";


export const load: PageServerData = async () => {
	const locals = getDbLocals();

	return { db: "", creds: locals };
};
