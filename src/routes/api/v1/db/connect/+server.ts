import { json, type RequestHandler } from '@sveltejs/kit';
import { db } from "$lib/server/surreal.svelte";

export const GET: RequestHandler = async () => {
    const connected = await db.connect();
    console.log("api connect", connected);
    return json({ connected });
};
