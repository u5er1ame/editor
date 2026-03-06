import { isConnected } from "$lib/server/surreal";
import type { PageServerData } from "./$types";

export const load: PageServerData = async () => {
	await isConnected();
};
