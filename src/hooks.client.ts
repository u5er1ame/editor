import type { HandleClientError } from "@sveltejs/kit"


export const handleError: HandleClientError = async ({ event, error, status, message }) => {
	console.error("client:", error, message);
	return { message }
}
