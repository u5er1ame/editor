import { db } from "$lib/server/root_db.svelte";
import { error, json, type RequestHandler } from "@sveltejs/kit";
import type { NamespaceDatabase } from "surrealdb";

export const POST: RequestHandler = async ({ request, locals }) => {
    const data: NamespaceDatabase = await request.json();
    const use = await db.use(data).catch(()=>{})
    if (!use) return error(400, "Cant switch namespace/database");
    locals.db.namespace = use.namespace ?? "main";
    locals.db.database = use.database ?? "main";
    return json(use);
};
