import { db } from "$lib/server/root_db.svelte";
import { json, type RequestHandler } from "@sveltejs/kit";
import type { NamespaceDatabase } from "surrealdb";

export const POST: RequestHandler = async ({ request }) => {
    const data: NamespaceDatabase = await request.json();
    console.log('use', data);
    return json(await db.use(data).catch(()=>{}));
};
