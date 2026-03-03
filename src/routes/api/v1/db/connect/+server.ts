import { json } from '@sveltejs/kit';
import { isConnected } from "$lib/server/surreal";

export const GET: RequestHandler = async ({ fetch }) => {
    const connected = await isConnected();
    return json({ connected });
};
