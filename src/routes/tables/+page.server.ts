import type { RequestHandler } from "../api/v1/db/status/$types";

export const load = async ({ fetch }) => {
	const res = await fetch("/api/v1/db/info");

	return await res.json();
};
