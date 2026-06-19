import type { Handle, HandleValidationError, HandleClientError } from "@sveltejs/kit"


export const handleError: HandleClientError = async ({ event, error, status, message }) => {
	console.log("handleError client hook");
	return { message }
}
