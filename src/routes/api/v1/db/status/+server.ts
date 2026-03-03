import { json } from '@sveltejs/kit';
import type { ConnectionStatus } from "surrealdb";
import { surreal } from '$lib/server/surreal';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async () => {
    // const connected = await isConnected();
    // if (!connected) {
    //     return json({ error: "db not connected" });
    // }
    return json({ message: surreal.status as ConnectionStatus });
}
