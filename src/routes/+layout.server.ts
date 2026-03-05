import { isConnected } from "$lib/server/surreal";
import type { PageServerData } from "./$types";

export const load: PageServerData = async () => {
	console.log('server');
	await isConnected();
};
