import { db } from "$lib/server/root_db.svelte";
import { error, json, type RequestHandler } from "@sveltejs/kit";
import type { NamespaceDatabase } from "surrealdb";

export const POST: RequestHandler = async ({ request, locals, cookies }) => {
    const data: NamespaceDatabase = await request.json();
    const use = await db.use(data).catch(()=>{})
    if (!use) return error(403, "Cant switch namespace/database");
    locals.db.namespace = use.namespace ?? "main";
    locals.db.database = use.database ?? "main";
    cookies.set("sr_db", use.database ?? "main", { path: "/" });
    return json(use);
};
