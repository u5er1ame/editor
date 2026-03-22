import { db } from "$lib/server/surreal.svelte";
import { json, type RequestHandler } from "@sveltejs/kit";

export const GET: RequestHandler = async () => {
    try {
        const res = await db.generateId();
        return json({ data: res });
    } catch (e: any) {
        return json({ error: e.body.message });
    }
}
