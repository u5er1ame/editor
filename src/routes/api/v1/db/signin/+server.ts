import { type RequestHandler } from "@sveltejs/kit";

import { db } from "$lib/server/root_db.svelte";
import { decodeJWT, getTokenMaxAge } from "$lib/utils";
import { getSystemInfo } from "$lib/db.remote";

export const POST: RequestHandler = async ({ request, cookies, locals }) => {
    const data = await request.json()
    // TODO: proper parsing with zod
    if (!data.namespace) {
        const info = await getSystemInfo()
        data.namespace = info?.defaults.namespace;
    }
    let body = { message: "OK" };
    let code = 200;
    await db.signin(data).then((tokens)=>{
        const decoded = decodeJWT(tokens.access);
		const maxAge = getTokenMaxAge(decoded);
        cookies.set("sr_token", tokens.access, {
            httpOnly: true,
            path: "/",
			maxAge
        });
        locals.db = {
            ...locals.db,
            token: tokens.access,
            username: decoded.ID,
            namespace: decoded.NS,
            database: decoded.DB,
        };
    }).catch((e)=>{ body.message = e.message; code = 400; });
    return new Response(JSON.stringify(body), { status: code });
}
