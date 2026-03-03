import type { ConnectionStatus } from "surrealdb";
import type { PageServerLoad } from "./$types";
import { isConnected } from "$lib/server/surreal";

export const load: PageServerLoad = async ({ fetch }) => {
	// const connected = await isConnected();
	const status: {message: ConnectionStatus} = await fetch('/api/v1/db/status').then(r=>r.json());
	return { db: status.message };
};
